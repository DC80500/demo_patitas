import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TutorService,
  TutorValidationError,
} from '../src/application/tutors/TutorService.ts'
import { LocalTutorRepository } from '../src/infrastructure/tutors/LocalTutorRepository.ts'

function setup() {
  const entries = new Map()
  const storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  }
  const repo = new LocalTutorRepository(storage)
  let id = 0
  return {
    entries,
    storage,
    service: new TutorService(repo, () => `new-${++id}`),
  }
}
const input = {
  firstName: '  Andrea  ',
  lastName: 'Prueba',
  dni: '00000099',
  phone: '900000099',
  email: 'ANDREA@EXAMPLE.COM',
  district: 'San Miguel',
  address: 'Calle Demo 99',
}

test('registration persists across repository instances and normalizes input', async () => {
  const { service, storage } = setup()
  const created = await service.save(input)
  assert.equal(created.firstName, 'Andrea')
  assert.equal(created.email, 'andrea@example.com')
  const persisted = await new LocalTutorRepository(storage).list()
  assert.equal(persisted.length, 6)
  assert.deepEqual(
    persisted.find((tutor) => tutor.id === created.id),
    created,
  )
})
test('duplicate DNI and invalid contact details never create another tutor', async () => {
  const { service } = setup()
  await assert.rejects(
    service.save({ ...input, dni: '00000001' }),
    (error) =>
      error instanceof TutorValidationError && Boolean(error.fields.dni),
  )
  await assert.rejects(
    service.save({ ...input, phone: '123', email: 'invalid' }),
    (error) =>
      error instanceof TutorValidationError &&
      Boolean(error.fields.phone) &&
      Boolean(error.fields.email),
  )
  assert.equal((await service.list()).length, 5)
})
test('editing retains associated pets and permits unchanged DNI', async () => {
  const { service } = setup()
  const tutor = (await service.list())[0]
  const edited = await service.save({ ...tutor, phone: '900000098' }, tutor.id)
  assert.deepEqual(edited.pets, tutor.pets)
  assert.equal(edited.phone, '900000098')
  assert.equal((await service.list()).length, 5)
})
test('invalid saved data is reported without overwriting the original', async () => {
  const { entries, storage } = setup()
  storage.setItem('patitas-demo.tutors.v1', 'broken')
  await assert.rejects(
    new LocalTutorRepository(storage).list(),
    /no son válidos/,
  )
  assert.equal(entries.get('patitas-demo.tutors.v1'), 'broken')
})
test('storage failure is surfaced instead of reporting a successful save', async () => {
  const repository = new LocalTutorRepository({
    getItem: () => null,
    setItem: () => {
      throw new Error('quota')
    },
  })
  await assert.rejects(repository.list(), /No se pudo guardar/)
})
