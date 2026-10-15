import { demoTutors } from '../tutors/demoTutors.ts'
import { demoPets } from '../pets/demoPets.ts'
import { demoClinicalEntries } from '../clinical/demoClinicalEntries.ts'
import { isTutor } from '../tutors/LocalTutorRepository.ts'
import { isPet } from '../pets/LocalPetRepository.ts'
import { isEntry } from '../clinical/LocalClinicalRepository.ts'
import type { Tutor } from '../../domain/tutors/Tutor'
import { demoStorageKeys } from './demoStorageKeys.ts'

const keys = [
  demoStorageKeys.tutors,
  demoStorageKeys.pets,
  demoStorageKeys.clinical,
] as const
const readyKey = demoStorageKeys.compact
const addressReadyKey = demoStorageKeys.addresses
const naturalTextReadyKey = demoStorageKeys.naturalText
const photosReadyKey = demoStorageKeys.photos
function refreshPetPhotos(storage: Storage): void {
  if (storage.getItem(photosReadyKey) === '1') return
  const pets = readLegacy(storage, keys[1], isPet)
  const updated = pets.map((pet) => {
    const seed = demoPets.find((item) => item.id === pet.id)
    return seed &&
      !pet.photo &&
      pet.name === seed.name &&
      pet.species === seed.species &&
      pet.color === seed.color
      ? { ...pet, photo: seed.photo }
      : pet
  })
  if (updated.some((pet, index) => pet !== pets[index]))
    storage.setItem(keys[1], JSON.stringify(updated))
  storage.setItem(photosReadyKey, '1')
}
function refreshNaturalText(storage: Storage): void {
  if (storage.getItem(naturalTextReadyKey) === '1') return
  const pets = readLegacy(storage, keys[1], isPet)
  const clinical = readLegacy(storage, keys[2], isEntry)
  const updatedPets = pets.map((pet) => {
    const seed = demoPets.find((item) => item.id === pet.id)
    if (!seed) return pet
    return {
      ...pet,
      vetName:
        pet.vetName === 'Clínica Veterinaria Demo' ? seed.vetName : pet.vetName,
      vaccines:
        pet.vaccines === 'Vacunas al día (datos ficticios).'
          ? seed.vaccines
          : pet.vaccines,
    }
  })
  const legacyClinicalText = {
    veterinarian: ['Veterinario Demo'],
    diagnosis: [
      'Evaluación general registrada en la demo.',
      'Control general de demostración.',
    ],
    treatment: [
      'Seguimiento indicado por el veterinario de demostración.',
      'Observaciones de seguimiento registradas en la demo.',
    ],
    vaccine: ['Vacuna de ejemplo'],
    notes: [
      'Atención ficticia para presentar el funcionamiento de la plataforma.',
    ],
  }
  const updatedClinical = clinical.map((entry) => {
    const seed = demoClinicalEntries.find((item) => item.id === entry.id)
    if (!seed) return entry
    const updated = { ...entry }
    for (const field of Object.keys(
      legacyClinicalText,
    ) as (keyof typeof legacyClinicalText)[]) {
      if (legacyClinicalText[field].includes(entry[field]))
        updated[field] = seed[field]
    }
    return updated
  })
  if (JSON.stringify(pets) !== JSON.stringify(updatedPets))
    storage.setItem(keys[1], JSON.stringify(updatedPets))
  if (JSON.stringify(clinical) !== JSON.stringify(updatedClinical))
    storage.setItem(keys[2], JSON.stringify(updatedClinical))
  storage.setItem(naturalTextReadyKey, '1')
}
function refreshAddresses(storage: Storage): void {
  if (storage.getItem(addressReadyKey) === '1') return
  const oldAddresses: Record<string, string> = {
    'tutor-1': 'Calle Demo 120',
    'tutor-2': 'Av. Ejemplo 245',
    'tutor-3': 'Jirón Demo 56',
  }
  const tutors = readLegacy(storage, keys[0], isTutor)
  const pets = readLegacy(storage, keys[1], isPet)
  const updatedTutors = tutors.map((tutor) => {
    const seed = demoTutors.find((item) => item.id === tutor.id)
    return seed &&
      tutor.address === oldAddresses[tutor.id] &&
      tutor.district === seed.district
      ? { ...tutor, address: seed.address }
      : tutor
  })
  const updatedPets = pets.map((pet) => {
    const seed = demoPets.find((item) => item.id === pet.id)
    return seed && pet.vetAddress === 'Av. Ejemplo 100'
      ? { ...pet, vetAddress: seed.vetAddress }
      : pet
  })
  if (updatedTutors.some((tutor, index) => tutor !== tutors[index]))
    storage.setItem(keys[0], JSON.stringify(updatedTutors))
  if (updatedPets.some((pet, index) => pet !== pets[index]))
    storage.setItem(keys[1], JSON.stringify(updatedPets))
  storage.setItem(addressReadyKey, '1')
}
function isQaTutor(tutor: Tutor): boolean {
  return (
    `${tutor.firstName} ${tutor.lastName}` === 'Sofía Demo Salazar' &&
    tutor.dni === '00000006' &&
    tutor.email === 'sofia@example.com' &&
    tutor.phone === '900000066'
  )
}
function finishMigration(storage: Storage): void {
  if (storage.getItem(readyKey) === '1') return
  const tutors = readLegacy(storage, keys[0], isTutor)
  const pets = readLegacy(storage, keys[1], isPet)
  const retained = tutors.filter(
    (tutor) =>
      !isQaTutor(tutor) || pets.some((pet) => pet.tutorId === tutor.id),
  )
  if (retained.length !== tutors.length)
    storage.setItem(keys[0], JSON.stringify(retained))
  storage.setItem(readyKey, '1')
}
function readLegacy<T extends { id: string }>(
  storage: Storage,
  key: string,
  guard: (value: unknown) => value is T,
): T[] {
  const raw = storage.getItem(key)
  if (raw === null) return []
  const records: unknown = JSON.parse(raw)
  if (
    !Array.isArray(records) ||
    !records.every(guard) ||
    new Set(records.map((record) => record.id)).size !== records.length
  )
    throw new Error(
      'Los datos anteriores no son válidos; se conservaron sin cambios.',
    )
  return records
}

// La versión anterior permanece intacta. La actualización se aplica una vez por navegador.
export function migrateDemoData(storage: Storage): void {
  if (keys.every((key) => storage.getItem(key) !== null)) {
    finishMigration(storage)
    refreshAddresses(storage)
    refreshNaturalText(storage)
    refreshPetPhotos(storage)
    return
  }
  const tutors = readLegacy(storage, demoStorageKeys.legacyTutors, isTutor)
  const pets = readLegacy(storage, demoStorageKeys.legacyPets, isPet)
  const clinical = readLegacy(storage, demoStorageKeys.legacyClinical, isEntry)
  const originalTutorIds = new Set([
    'tutor-1',
    'tutor-2',
    'tutor-3',
    'tutor-4',
    'tutor-5',
  ])
  const originalPetIds = new Set(['pet-1', 'pet-2', 'pet-3', 'pet-4', 'pet-5'])
  const originalClinicalIds = new Set([
    'clinical-1',
    'clinical-2',
    'clinical-3',
    'clinical-4',
    'clinical-5',
  ])
  const customPets = pets.filter(
    (pet) =>
      !originalPetIds.has(pet.id) &&
      !(
        pet.name === 'Copito Demo' &&
        pet.registration === 'PA-000006' &&
        pet.vetName === 'Veterinario Demo' &&
        pet.vetPhone === '900000088'
      ),
  )
  const neededTutors = new Set(customPets.map((pet) => pet.tutorId))
  const seedTutorIds = new Set(demoTutors.map((tutor) => tutor.id))
  const retainedTutors = tutors.filter(
    (tutor) =>
      !seedTutorIds.has(tutor.id) &&
      (neededTutors.has(tutor.id) ||
        (!originalTutorIds.has(tutor.id) && !isQaTutor(tutor))),
  )
  const nextTutors = [...structuredClone(demoTutors), ...retainedTutors]
  const tutorIds = new Set(nextTutors.map((tutor) => tutor.id))
  const nextPets = [...structuredClone(demoPets), ...customPets]
  if (
    nextPets.some((pet) => !tutorIds.has(pet.tutorId)) ||
    new Set(nextPets.map((pet) => pet.registration)).size !== nextPets.length ||
    new Set(nextTutors.map((tutor) => tutor.dni)).size !== nextTutors.length
  )
    throw new Error(
      'No se pudo actualizar la demo sin afectar sus asociaciones. Los datos anteriores se conservaron.',
    )
  const petIds = new Set(nextPets.map((pet) => pet.id))
  const nextClinical = [
    ...structuredClone(demoClinicalEntries),
    ...clinical.filter(
      (entry) => !originalClinicalIds.has(entry.id) && petIds.has(entry.petId),
    ),
  ]
  const values = [
    nextTutors.map((tutor) => ({
      ...tutor,
      pets: nextPets
        .filter((pet) => pet.tutorId === tutor.id)
        .map((pet) => ({ id: pet.id, name: pet.name, species: pet.species })),
    })),
    nextPets,
    nextClinical,
  ]
  keys.forEach((key, index) => {
    if (storage.getItem(key) === null)
      storage.setItem(key, JSON.stringify(values[index]))
  })
  finishMigration(storage)
  refreshAddresses(storage)
  refreshNaturalText(storage)
  refreshPetPhotos(storage)
}
