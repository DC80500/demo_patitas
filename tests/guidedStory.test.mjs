import test from 'node:test'
import assert from 'node:assert/strict'
import {
  advanceStory,
  newGuidedStory,
  isGuidedStory,
  reconcileStory,
} from '../src/domain/guidedStory/GuidedStory.ts'
import { LocalGuidedStoryRepository } from '../src/infrastructure/guidedStory/LocalGuidedStoryRepository.ts'
import { demoTutors } from '../src/infrastructure/tutors/demoTutors.ts'
import { demoPets } from '../src/infrastructure/pets/demoPets.ts'
import { demoClinicalEntries } from '../src/infrastructure/clinical/demoClinicalEntries.ts'
import { LocalTutorRepository } from '../src/infrastructure/tutors/LocalTutorRepository.ts'
import { LocalPetRepository } from '../src/infrastructure/pets/LocalPetRepository.ts'
import { LocalClinicalRepository } from '../src/infrastructure/clinical/LocalClinicalRepository.ts'
import { TutorService } from '../src/application/tutors/TutorService.ts'
import { PetService } from '../src/application/pets/PetService.ts'
import { ClinicalService } from '../src/application/clinical/ClinicalService.ts'
function setup() {
  const entries = new Map()
  const storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  }
  return {
    entries,
    storage,
    repository: new LocalGuidedStoryRepository(() => storage),
  }
}
const tutor = demoTutors[0],
  pet = demoPets[0],
  entry = demoClinicalEntries[0]
function createdPet() {
  let state = advanceStory(newGuidedStory(), { type: 'tutor-created', tutor })
  return advanceStory(state, { type: 'pet-created', pet })
}
test('all five steps require the matching successful action before completion', () => {
  let state = createdPet()
  assert.equal(state.step, 'approval')
  state = advanceStory(state, { type: 'pet-approved', pet })
  assert.equal(state.step, 'dni')
  state = advanceStory(state, { type: 'dni-viewed', petId: pet.id })
  assert.equal(state.step, 'clinical')
  state = advanceStory(state, { type: 'attention-created', entry })
  assert.equal(state.step, 'complete')
  assert.equal(state.entryId, entry.id)
  assert.equal(isGuidedStory(state), true)
})
test('unrelated records, pending approval and skipped steps never advance the story', () => {
  assert.throws(() =>
    advanceStory(newGuidedStory(), { type: 'dni-viewed', petId: pet.id }),
  )
  const state = advanceStory(newGuidedStory(), { type: 'tutor-created', tutor })
  assert.throws(() =>
    advanceStory(state, { type: 'pet-created', pet: demoPets[3] }),
  )
  assert.throws(() =>
    advanceStory(createdPet(), {
      type: 'pet-approved',
      pet: { ...pet, status: 'Pendiente' },
    }),
  )
  let clinical = advanceStory(createdPet(), { type: 'pet-approved', pet })
  clinical = advanceStory(clinical, { type: 'dni-viewed', petId: pet.id })
  assert.throws(() =>
    advanceStory(clinical, {
      type: 'attention-created',
      entry: { ...entry, petId: 'other' },
    }),
  )
})
test('paused progress survives reload and resumes without duplicating completed steps', async () => {
  const { storage, repository } = setup()
  const paused = { ...createdPet(), paused: true }
  await repository.save(paused)
  assert.deepEqual(
    await new LocalGuidedStoryRepository(() => storage).load(),
    paused,
  )
  assert.throws(
    () => advanceStory(paused, { type: 'pet-approved', pet }),
    /Retoma/,
  )
  assert.equal(
    advanceStory({ ...paused, paused: false }, { type: 'pet-approved', pet })
      .step,
    'dni',
  )
})
test('resume repairs missing references and requires review after outside edits', () => {
  const state = { ...createdPet(), step: 'complete', entryId: entry.id }
  assert.equal(reconcileStory(state, [], demoPets, [entry]).step, 'tutor')
  assert.equal(reconcileStory(state, demoTutors, [], [entry]).step, 'pet')
  assert.equal(
    reconcileStory(state, demoTutors, [{ ...pet, tutorId: 'other' }], [entry])
      .step,
    'pet',
  )
  assert.equal(
    reconcileStory(
      state,
      demoTutors,
      [{ ...pet, status: 'Pendiente' }],
      [entry],
    ).step,
    'approval',
  )
  assert.equal(reconcileStory(state, demoTutors, demoPets, []).step, 'clinical')
  assert.equal(
    reconcileStory(createdPet(), demoTutors, demoPets, []).step,
    'dni',
  )
})
test('malformed progress remains intact and failed saves are reported', async () => {
  const { storage, repository } = setup()
  storage.setItem('patitas-demo.guided-story.v1', 'broken')
  await assert.rejects(repository.load(), /No se pudo recuperar/)
  assert.equal(storage.getItem('patitas-demo.guided-story.v1'), 'broken')
  assert.equal(isGuidedStory({ step: 'complete', paused: false }), false)
  storage.setItem = () => {
    throw new Error('quota')
  }
  await assert.rejects(
    repository.save(newGuidedStory()),
    /no se pudo conservar/i,
  )
  assert.equal(storage.getItem('patitas-demo.guided-story.v1'), 'broken')
})
test('guided actions use real services and persist linked tutor, approved pet and consultation', async () => {
  const { storage, repository } = setup()
  const owners = new LocalTutorRepository(storage),
    animals = new LocalPetRepository(storage),
    history = new LocalClinicalRepository(storage)
  const tutors = new TutorService(owners, () => 'guided-tutor', animals),
    pets = new PetService(animals, owners, () => 'guided-pet'),
    clinical = new ClinicalService(
      history,
      animals,
      () => 'guided-entry',
      () => '2026-10-14',
    )
  let state = newGuidedStory()
  const createdTutor = await tutors.save({
    ...tutor,
    dni: '00000088',
    email: 'historia@example.com',
  })
  state = advanceStory(state, { type: 'tutor-created', tutor: createdTutor })
  const created = await pets.save({
    ...pet,
    tutorId: createdTutor.id,
    name: 'Historia',
  })
  state = advanceStory(state, { type: 'pet-created', pet: created })
  state = advanceStory(state, {
    type: 'pet-approved',
    pet: await pets.approve(created.id),
  })
  state = advanceStory(state, { type: 'dni-viewed', petId: created.id })
  const createdEntry = await clinical.register({ ...entry, petId: created.id })
  state = advanceStory(state, {
    type: 'attention-created',
    entry: createdEntry,
  })
  await repository.save(state)
  assert.equal((await repository.load()).step, 'complete')
  assert.equal(
    (await tutors.list()).find((item) => item.id === createdTutor.id).pets[0]
      .id,
    createdEntry.petId,
  )
  assert.equal(
    (await pets.list()).find((item) => item.id === created.id).status,
    'Aprobado',
  )
  assert.equal(
    (await clinical.list()).find((item) => item.id === createdEntry.id).petId,
    created.id,
  )
})
