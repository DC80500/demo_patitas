import test from 'node:test'
import assert from 'node:assert/strict'
import { migrateDemoData } from '../src/infrastructure/demo/migrateDemoData.ts'
import { demoTutors } from '../src/infrastructure/tutors/demoTutors.ts'
import { demoPets } from '../src/infrastructure/pets/demoPets.ts'
import { demoClinicalEntries } from '../src/infrastructure/clinical/demoClinicalEntries.ts'
function setup() {
  const entries = new Map()
  return {
    entries,
    storage: {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
    },
  }
}
const read = (storage, name) =>
  JSON.parse(storage.getItem(`patitas-demo.${name}.v2`))
const qaTutor = {
  ...demoTutors[0],
  id: 'qa-tutor',
  firstName: 'Sofía',
  lastName: 'Demo Salazar',
  dni: '00000006',
  email: 'sofia@example.com',
  phone: '900000066',
  pets: [],
}
const qaPet = {
  ...demoPets[0],
  id: 'qa-pet',
  name: 'Copito Demo',
  registration: 'PA-000006',
  tutorId: qaTutor.id,
  vetName: 'Veterinario Demo',
  vetPhone: '900000088',
}
test('compact examples have three tutors, four pets, one pending and two clinical histories', () => {
  const { storage } = setup()
  migrateDemoData(storage)
  const tutors = read(storage, 'tutors'),
    pets = read(storage, 'pets'),
    clinical = read(storage, 'clinical')
  assert.equal(tutors.length, 3)
  assert.equal(pets.length, 4)
  assert.equal(pets.filter((pet) => pet.status === 'Aprobado').length, 3)
  assert.equal(pets.filter((pet) => pet.status === 'Pendiente').length, 1)
  assert.equal(new Set(clinical.map((entry) => entry.petId)).size, 2)
  assert.equal(clinical.length, 3)
  assert.deepEqual(
    tutors.map((tutor) => tutor.pets.length),
    [2, 1, 1],
  )
})
test('legacy test records are omitted with their attention records; original data remains recoverable', () => {
  const { storage } = setup()
  storage.setItem(
    'patitas-demo.tutors.v1',
    JSON.stringify([...demoTutors, qaTutor]),
  )
  storage.setItem('patitas-demo.pets.v1', JSON.stringify([...demoPets, qaPet]))
  storage.setItem(
    'patitas-demo.clinical.v1',
    JSON.stringify([
      ...demoClinicalEntries,
      { ...demoClinicalEntries[0], id: 'qa-clinical', petId: qaPet.id },
    ]),
  )
  const original = storage.getItem('patitas-demo.tutors.v1')
  migrateDemoData(storage)
  assert.equal(read(storage, 'tutors').length, 3)
  assert.equal(read(storage, 'pets').length, 4)
  assert.equal(read(storage, 'clinical').length, 3)
  assert.equal(storage.getItem('patitas-demo.tutors.v1'), original)
})
test('partially completed compact data removes only the unlinked QA tutor', () => {
  const { storage } = setup()
  storage.setItem(
    'patitas-demo.tutors.v2',
    JSON.stringify([...demoTutors, qaTutor]),
  )
  storage.setItem('patitas-demo.pets.v2', JSON.stringify(demoPets))
  storage.setItem(
    'patitas-demo.clinical.v2',
    JSON.stringify(demoClinicalEntries),
  )
  migrateDemoData(storage)
  assert.equal(read(storage, 'tutors').length, 3)
  const linked = {
    ...demoPets[0],
    id: 'custom-linked',
    registration: 'PA-000099',
    tutorId: qaTutor.id,
  }
  const second = setup().storage
  second.setItem(
    'patitas-demo.tutors.v1',
    JSON.stringify([...demoTutors, qaTutor]),
  )
  second.setItem('patitas-demo.pets.v1', JSON.stringify([...demoPets, linked]))
  migrateDemoData(second)
  assert.equal(read(second, 'tutors').length, 4)
  assert.equal(read(second, 'pets').length, 5)
})

test('address refresh updates stored examples once and preserves manual edits and contacts', () => {
  const { storage } = setup()
  const oldTutors = structuredClone(demoTutors)
  oldTutors[0].address = 'Calle Demo 120'
  oldTutors[1].address = 'Av. Ejemplo 245'
  oldTutors[2].address = 'Dirección personalizada'
  const oldPets = demoPets.map((pet) => ({
    ...pet,
    vetAddress: 'Av. Ejemplo 100',
  }))
  storage.setItem('patitas-demo.tutors.v2', JSON.stringify(oldTutors))
  storage.setItem('patitas-demo.pets.v2', JSON.stringify(oldPets))
  storage.setItem(
    'patitas-demo.clinical.v2',
    JSON.stringify(demoClinicalEntries),
  )
  storage.setItem('patitas-demo.compact-ready.v2', '1')
  migrateDemoData(storage)
  const updated = read(storage, 'tutors')
  assert.equal(updated[0].address, 'Av. José Larco')
  assert.equal(updated[1].address, 'Av. San Borja Norte')
  assert.equal(updated[2].address, 'Dirección personalizada')
  assert.equal(updated[0].phone, oldTutors[0].phone)
  assert.equal(
    read(storage, 'pets')[0].vetAddress,
    'Av. José Larco, Miraflores',
  )
  updated[0].address = 'Otra dirección'
  storage.setItem('patitas-demo.tutors.v2', JSON.stringify(updated))
  migrateDemoData(storage)
  assert.equal(read(storage, 'tutors')[0].address, 'Otra dirección')
  assert.deepEqual(read(storage, 'clinical'), demoClinicalEntries)
})

test('natural wording refreshes only original example fields and preserves manual clinical data', () => {
  const { storage } = setup()
  const pets = structuredClone(demoPets)
  pets[0].vetName = 'Clínica Veterinaria Demo'
  pets[0].vaccines = 'Vacunas al día (datos ficticios).'
  pets[1].vetName = 'Veterinario particular'
  const clinical = structuredClone(demoClinicalEntries)
  clinical[0].veterinarian = 'Veterinario Demo'
  clinical[0].diagnosis = 'Evaluación general registrada en la demo.'
  clinical[0].treatment =
    'Seguimiento indicado por el veterinario de demostración.'
  clinical[0].notes =
    'Atención ficticia para presentar el funcionamiento de la plataforma.'
  clinical[1].vaccine = 'Vacuna de ejemplo'
  clinical[2].diagnosis = 'Diagnóstico editado por el usuario'
  const custom = { ...clinical[0], id: 'custom-attention' }
  storage.setItem('patitas-demo.tutors.v2', JSON.stringify(demoTutors))
  storage.setItem('patitas-demo.pets.v2', JSON.stringify(pets))
  storage.setItem(
    'patitas-demo.clinical.v2',
    JSON.stringify([...clinical, custom]),
  )
  storage.setItem('patitas-demo.compact-ready.v2', '1')
  storage.setItem('patitas-demo.real-addresses.v1', '1')
  migrateDemoData(storage)
  assert.deepEqual(read(storage, 'pets')[0], demoPets[0])
  assert.equal(read(storage, 'pets')[1].vetName, 'Veterinario particular')
  assert.deepEqual(read(storage, 'clinical')[0], demoClinicalEntries[0])
  assert.equal(read(storage, 'clinical')[1].vaccine, 'Antirrábica')
  assert.equal(
    read(storage, 'clinical')[2].diagnosis,
    'Diagnóstico editado por el usuario',
  )
  assert.deepEqual(read(storage, 'clinical')[3], custom)
  const updated = read(storage, 'pets')
  updated[0].vetName = 'Consultorio del tutor'
  storage.setItem('patitas-demo.pets.v2', JSON.stringify(updated))
  migrateDemoData(storage)
  assert.equal(read(storage, 'pets')[0].vetName, 'Consultorio del tutor')
})

test('photos fill only unchanged examples and respect uploads, custom records and later removal', () => {
  const { storage } = setup()
  const pets = demoPets.map((pet) => ({ ...pet, photo: '' }))
  pets[1].photo = 'data:image/png;base64,aGVsbG8='
  pets[2].color = 'Otro color'
  const custom = { ...pets[0], id: 'custom-pet', registration: 'PA-000099' }
  storage.setItem('patitas-demo.tutors.v2', JSON.stringify(demoTutors))
  storage.setItem('patitas-demo.pets.v2', JSON.stringify([...pets, custom]))
  storage.setItem(
    'patitas-demo.clinical.v2',
    JSON.stringify(demoClinicalEntries),
  )
  migrateDemoData(storage)
  const updated = read(storage, 'pets')
  assert.equal(updated[0].photo, demoPets[0].photo)
  assert.equal(updated[1].photo, pets[1].photo)
  assert.equal(updated[2].photo, '')
  assert.equal(updated[3].photo, demoPets[3].photo)
  assert.equal(updated[4].photo, '')
  assert.equal(new Set(demoPets.map((pet) => pet.photo)).size, 4)
  for (const pet of demoPets) {
    const bytes = Buffer.from(pet.photo.split(',')[1], 'base64')
    assert.equal(bytes[0], 0xff)
    assert.equal(bytes[1], 0xd8)
    assert.ok(bytes.length < 40000)
  }
  updated[0].photo = ''
  storage.setItem('patitas-demo.pets.v2', JSON.stringify(updated))
  migrateDemoData(storage)
  assert.equal(read(storage, 'pets')[0].photo, '')
})

test('custom records and dependencies survive; repeated migration does not reset edits', () => {
  const { storage } = setup()
  const owner = { ...demoTutors[0], id: 'tutor-4', dni: '00000004', pets: [] }
  const pet = {
    ...demoPets[0],
    id: 'custom-pet',
    registration: 'PA-000099',
    tutorId: owner.id,
  }
  storage.setItem(
    'patitas-demo.tutors.v1',
    JSON.stringify([...demoTutors, owner]),
  )
  storage.setItem('patitas-demo.pets.v1', JSON.stringify([...demoPets, pet]))
  storage.setItem(
    'patitas-demo.clinical.v1',
    JSON.stringify([
      { ...demoClinicalEntries[0], id: 'custom-entry', petId: pet.id },
    ]),
  )
  migrateDemoData(storage)
  assert.equal(read(storage, 'tutors').length, 4)
  assert.equal(read(storage, 'pets').length, 5)
  assert.equal(read(storage, 'clinical').length, 4)
  assert.equal(
    read(storage, 'tutors').find((tutor) => tutor.id === owner.id).pets[0].id,
    pet.id,
  )
  const updated = read(storage, 'pets')
  updated[0].color = 'Blanco'
  storage.setItem('patitas-demo.pets.v2', JSON.stringify(updated))
  migrateDemoData(storage)
  assert.equal(read(storage, 'pets')[0].color, 'Blanco')
})
test('invalid legacy data is never replaced and migration can resume after failed storage writes', () => {
  const { storage, entries } = setup()
  storage.setItem('patitas-demo.tutors.v1', 'broken')
  assert.throws(() => migrateDemoData(storage))
  assert.equal(entries.get('patitas-demo.tutors.v1'), 'broken')
  assert.equal(storage.getItem('patitas-demo.tutors.v2'), null)
  entries.clear()
  const originalWrite = storage.setItem
  storage.setItem = (key, value) => {
    if (key === 'patitas-demo.pets.v2') throw new Error('quota')
    originalWrite(key, value)
  }
  assert.throws(() => migrateDemoData(storage), /quota/)
  storage.setItem = originalWrite
  migrateDemoData(storage)
  assert.equal(read(storage, 'pets').length, 4)
  assert.equal(read(storage, 'clinical').length, 3)
})
