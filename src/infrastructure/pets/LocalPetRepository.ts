import type { PetRepository } from '../../application/pets/PetRepository'
import { validatePet, type Pet } from '../../domain/pets/Pet.ts'
import { demoPets } from './demoPets.ts'
import { demoStorageKeys } from '../demo/demoStorageKeys.ts'
const KEY = demoStorageKeys.pets
export function isPet(value: unknown): value is Pet {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  for (const field of [
    'id',
    'registration',
    'status',
    'tutorId',
    'name',
    'species',
    'breed',
    'sex',
    'ageUnit',
    'color',
    'photo',
    'microchip',
    'vaccines',
    'sterilized',
    'notes',
    'vetName',
    'vetPhone',
    'vetAddress',
  ])
    if (typeof record[field] !== 'string') return false
  if (
    typeof record.age !== 'number' ||
    !record.id ||
    !/^PA-\d{6,}$/.test(String(record.registration)) ||
    !['Pendiente', 'Aprobado'].includes(String(record.status))
  )
    return false
  return Object.keys(validatePet(record as unknown as Pet)).length === 0
}
export class LocalPetRepository implements PetRepository {
  private readonly storage: Storage | (() => Storage)
  constructor(storage: Storage | (() => Storage)) {
    this.storage = storage
  }
  private getStorage() {
    return typeof this.storage === 'function' ? this.storage() : this.storage
  }
  async list(): Promise<Pet[]> {
    let raw: string | null
    try {
      raw = this.getStorage().getItem(KEY)
    } catch {
      throw new Error('No se pudo acceder al almacenamiento local de mascotas.')
    }
    if (raw === null) {
      const seed = structuredClone(demoPets)
      this.write(seed)
      return seed
    }
    try {
      const data: unknown = JSON.parse(raw)
      if (
        !Array.isArray(data) ||
        !data.every(isPet) ||
        new Set(data.map((pet) => pet.id)).size !== data.length ||
        new Set(data.map((pet) => pet.registration)).size !== data.length
      )
        throw new Error('invalid')
      return data
    } catch {
      throw new Error(
        'Los datos locales de mascotas no son válidos. No se modificaron los registros.',
      )
    }
  }
  async save(pet: Pet) {
    const pets = await this.list()
    const index = pets.findIndex((item) => item.id === pet.id)
    if (index < 0) pets.push(pet)
    else pets[index] = pet
    this.write(pets)
  }
  private write(pets: Pet[]) {
    try {
      this.getStorage().setItem(KEY, JSON.stringify(pets))
    } catch {
      throw new Error(
        'No se pudo guardar la mascota. El almacenamiento puede estar lleno o bloqueado; prueba con una fotografía más pequeña.',
      )
    }
  }
}
