import type { TutorRepository } from '../../application/tutors/TutorRepository'
import { validateTutor, type Tutor } from '../../domain/tutors/Tutor.ts'
import { demoTutors } from './demoTutors.ts'

const STORAGE_KEY = 'patitas-demo.tutors.v1'

function isTutor(value: unknown): value is Tutor {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || !record.id) return false
  for (const field of [
    'firstName',
    'lastName',
    'dni',
    'phone',
    'email',
    'address',
    'district',
  ]) {
    if (typeof record[field] !== 'string') return false
  }
  if (Object.keys(validateTutor(record as unknown as Tutor)).length)
    return false
  return (
    Array.isArray(record.pets) &&
    record.pets.every(
      (pet) =>
        pet &&
        typeof pet.id === 'string' &&
        typeof pet.name === 'string' &&
        ['Perro', 'Gato', 'Otro'].includes(pet.species),
    )
  )
}

export class LocalTutorRepository implements TutorRepository {
  private readonly storage: Storage | (() => Storage)
  constructor(storage: Storage | (() => Storage)) {
    this.storage = storage
  }
  async list(): Promise<Tutor[]> {
    let raw: string | null
    try {
      raw = this.getStorage().getItem(STORAGE_KEY)
    } catch {
      throw new Error(
        'No se pudo acceder al almacenamiento local. Revisa los permisos del navegador.',
      )
    }
    if (raw === null) {
      const seed = structuredClone(demoTutors)
      this.write(seed)
      return seed
    }
    try {
      const parsed: unknown = JSON.parse(raw)
      if (
        !Array.isArray(parsed) ||
        !parsed.every(isTutor) ||
        new Set(parsed.map((t) => t.id)).size !== parsed.length ||
        new Set(parsed.map((t) => t.dni)).size !== parsed.length
      )
        throw new Error('invalid')
      return parsed
    } catch {
      throw new Error(
        'Los datos locales de tutores no son válidos. No se modificaron tus registros.',
      )
    }
  }
  async save(tutor: Tutor): Promise<void> {
    const tutors = await this.list()
    const index = tutors.findIndex((item) => item.id === tutor.id)
    if (index === -1) tutors.push(tutor)
    else tutors[index] = tutor
    this.write(tutors)
  }
  private write(tutors: Tutor[]) {
    try {
      this.getStorage().setItem(STORAGE_KEY, JSON.stringify(tutors))
    } catch {
      throw new Error(
        'No se pudo guardar el registro. El almacenamiento local puede estar lleno o bloqueado.',
      )
    }
  }
  private getStorage(): Storage {
    return typeof this.storage === 'function' ? this.storage() : this.storage
  }
}
