import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ClinicalService,
  ClinicalValidationError,
} from '../src/application/clinical/ClinicalService.ts'
import { LocalClinicalRepository } from '../src/infrastructure/clinical/LocalClinicalRepository.ts'
import { LocalPetRepository } from '../src/infrastructure/pets/LocalPetRepository.ts'
import { LocalTutorRepository } from '../src/infrastructure/tutors/LocalTutorRepository.ts'
import { TutorService } from '../src/application/tutors/TutorService.ts'
import { PetService } from '../src/application/pets/PetService.ts'
import { demoClinicalEntries } from '../src/infrastructure/clinical/demoClinicalEntries.ts'
import { demoPets } from '../src/infrastructure/pets/demoPets.ts'
function setup() {
  const entries = new Map()
  const storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  }
  const repo = new LocalClinicalRepository(storage)
  const pets = new LocalPetRepository(storage)
  let id = 0
  return {
    entries,
    storage,
    repo,
    pets,
    service: new ClinicalService(
      repo,
      pets,
      () => `new-${++id}`,
      () => '2026-10-14',
    ),
  }
}
const input = {
  ...demoClinicalEntries[0],
  date: '2026-10-14',
  veterinarian: '  Veterinario Demo  ',
  reason: 'Control demo',
  nextVisit: '2026-10-20',
}
test('consultation normalizes data, persists and keeps other pet histories', async () => {
  const { service, storage } = setup()
  const created = await service.register(input)
  assert.equal(created.veterinarian, 'Veterinario Demo')
  assert.equal(created.petId, 'pet-1')
  const persisted = await new LocalClinicalRepository(storage).list()
  assert.equal(persisted.length, 6)
  assert.deepEqual(
    persisted.find((entry) => entry.id === created.id),
    created,
  )
  assert.equal(persisted.filter((entry) => entry.petId === 'pet-2').length, 1)
})
test('vaccine uses its own fields and clears unrelated consultation fields', async () => {
  const { service } = setup()
  const entry = await service.register({
    ...input,
    kind: 'Vacuna',
    vaccine: '  Vacuna Demo  ',
  })
  assert.equal(entry.vaccine, 'Vacuna Demo')
  assert.equal(entry.reason, '')
  assert.equal(entry.diagnosis, '')
  assert.equal(entry.treatment, '')
})
test('invalid dates, future attention and earlier follow-up are rejected', async () => {
  const { service } = setup()
  for (const values of [
    { date: '2026-02-30' },
    { date: '2026-10-15' },
    { nextVisit: '2026-10-13' },
    { nextVisit: 'not-a-date' },
  ])
    await assert.rejects(
      service.register({ ...input, ...values }),
      (error) => error instanceof ClinicalValidationError,
    )
  assert.equal((await service.list()).length, 5)
  await service.register({
    ...input,
    date: '2024-02-29',
    nextVisit: '2024-03-01',
  })
})
test('missing clinical fields and unknown pets never create records', async () => {
  const { service } = setup()
  for (const values of [
    { reason: '' },
    { diagnosis: '' },
    { veterinarian: '' },
    { petId: 'missing' },
    { kind: 'Vacuna', vaccine: '' },
  ])
    await assert.rejects(
      service.register({ ...input, ...values }),
      (error) => error instanceof ClinicalValidationError,
    )
  assert.equal((await service.list()).length, 5)
})
test('corrupt persisted data stays intact and unavailable storage is reported', async () => {
  const { storage, entries, repo } = setup()
  storage.setItem('patitas-demo.clinical.v1', 'broken')
  await assert.rejects(repo.list(), /no son válidos/)
  assert.equal(entries.get('patitas-demo.clinical.v1'), 'broken')
  await assert.rejects(
    new LocalClinicalRepository(() => {
      throw new Error('blocked')
    }).list(),
    /No se pudo acceder/,
  )
})
test('write failure is surfaced without creating an attention', async () => {
  const { service, storage } = setup()
  await service.list()
  storage.setItem = () => {
    throw new Error('quota')
  }
  await assert.rejects(service.register(input), /No se pudo guardar/)
  assert.equal((await service.list()).length, 5)
})
test('complete demo connects new tutor, approved pet and clinical attention', async () => {
  const { storage, pets, service } = setup()
  const tutorRepo = new LocalTutorRepository(storage)
  const tutorService = new TutorService(tutorRepo, () => 'flow-tutor', pets)
  const petService = new PetService(pets, tutorRepo, () => 'flow-pet')
  const tutor = await tutorService.save({
    firstName: 'Tutor',
    lastName: 'Demo',
    dni: '00000099',
    phone: '900000099',
    email: 'demo@example.com',
    address: 'Calle Demo 99',
    district: 'San Miguel',
  })
  const pet = await petService.save({
    ...demoPets[0],
    tutorId: tutor.id,
    name: 'Mascota Demo',
  })
  await petService.approve(pet.id)
  const entry = await service.register({ ...input, petId: pet.id })
  assert.equal(
    (await petService.list()).find((item) => item.id === pet.id).status,
    'Aprobado',
  )
  assert.equal(
    (await tutorService.list()).find((item) => item.id === tutor.id).pets[0].id,
    entry.petId,
  )
  assert.equal(
    (await service.list()).find((item) => item.id === entry.id).petId,
    pet.id,
  )
})
