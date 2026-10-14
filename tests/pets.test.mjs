import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PetService,
  PetValidationError,
} from '../src/application/pets/PetService.ts'
import { TutorService } from '../src/application/tutors/TutorService.ts'
import { LocalPetRepository } from '../src/infrastructure/pets/LocalPetRepository.ts'
import { LocalTutorRepository } from '../src/infrastructure/tutors/LocalTutorRepository.ts'
import { demoPets } from '../src/infrastructure/pets/demoPets.ts'

function setup() {
  const entries = new Map()
  const storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  }
  const repo = new LocalPetRepository(storage)
  const tutorRepo = new LocalTutorRepository(storage)
  let id = 0
  return {
    entries,
    storage,
    repo,
    service: new PetService(repo, tutorRepo, () => `new-${++id}`),
    tutors: new TutorService(tutorRepo, () => `tutor-new-${++id}`, repo),
  }
}
const input = { ...demoPets[0], name: '  Copito  ', microchip: 'CHIP-99' }
test('new pet persists with its own sequential registration and pending status', async () => {
  const { service, storage } = setup()
  const first = await service.save(input)
  const second = await service.save({ ...input, microchip: '' })
  assert.equal(first.name, 'Copito')
  assert.equal(first.registration, 'PA-000006')
  assert.equal(second.registration, 'PA-000007')
  assert.notEqual(first.id, second.id)
  assert.equal(first.status, 'Pendiente')
  assert.deepEqual(
    (await new LocalPetRepository(storage).list()).find(
      (pet) => pet.id === first.id,
    ),
    first,
  )
})
test('approval enables identity; editing preserves number and requires approval again', async () => {
  const { service } = setup()
  const pet = await service.save(input)
  const approved = await service.approve(pet.id)
  assert.equal(approved.status, 'Aprobado')
  const edited = await service.save({ ...approved, color: 'Blanco' }, pet.id)
  assert.equal(edited.registration, pet.registration)
  assert.equal(edited.status, 'Pendiente')
  assert.equal((await service.list()).length, 6)
})
test('changing tutor updates both tutors associations from pet records', async () => {
  const { service, tutors } = setup()
  const pet = await service.save(input)
  assert.equal(
    (await tutors.list()).find((tutor) => tutor.id === 'tutor-1').pets.length,
    3,
  )
  await service.save({ ...pet, tutorId: 'tutor-4' }, pet.id)
  const owners = await tutors.list()
  assert.equal(owners.find((tutor) => tutor.id === 'tutor-1').pets.length, 2)
  assert.deepEqual(owners.find((tutor) => tutor.id === 'tutor-4').pets, [
    { id: pet.id, name: 'Copito', species: 'Perro' },
  ])
  const owner = owners.find((tutor) => tutor.id === 'tutor-4')
  const editedTutor = await tutors.save(
    { ...owner, address: 'Calle Demo 404' },
    owner.id,
  )
  assert.deepEqual(editedTutor.pets, owner.pets)
})
test('invalid owner, age and duplicate microchip do not create records', async () => {
  const { service } = setup()
  await assert.rejects(
    service.save({ ...input, tutorId: 'missing' }),
    (error) =>
      error instanceof PetValidationError && Boolean(error.fields.tutorId),
  )
  await assert.rejects(service.save({ ...input, age: -1 }), (error) =>
    Boolean(error.fields.age),
  )
  await service.save(input)
  await assert.rejects(service.save(input), (error) =>
    Boolean(error.fields.microchip),
  )
  assert.equal((await service.list()).length, 6)
})
test('unsafe photo values are rejected and valid image data persists', async () => {
  const { service } = setup()
  await assert.rejects(
    service.save({ ...input, photo: 'https://example.com/image.jpg' }),
    (error) => Boolean(error.fields.photo),
  )
  const pet = await service.save({
    ...input,
    photo: 'data:image/png;base64,aGVsbG8=',
  })
  assert.equal(
    (await service.list()).find((item) => item.id === pet.id).photo,
    pet.photo,
  )
})
test('corrupt and duplicate persisted numbers are reported without overwriting data', async () => {
  const { storage, entries, repo } = setup()
  const raw = JSON.stringify([
    demoPets[0],
    { ...demoPets[1], registration: demoPets[0].registration },
  ])
  storage.setItem('patitas-demo.pets.v1', raw)
  await assert.rejects(repo.list(), /no son válidos/)
  assert.equal(entries.get('patitas-demo.pets.v1'), raw)
})
test('failed writes never report approval success', async () => {
  const { service, storage } = setup()
  const pet = await service.save(input)
  storage.setItem = () => {
    throw new Error('quota')
  }
  await assert.rejects(service.approve(pet.id), /No se pudo guardar/)
  assert.equal(
    (await service.list()).find((item) => item.id === pet.id).status,
    'Pendiente',
  )
})
