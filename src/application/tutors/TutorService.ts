import {
  normalizeTutor,
  validateTutor,
  type TutorInput,
  type TutorErrors,
  type Tutor,
} from '../../domain/tutors/Tutor.ts'
import type { TutorRepository } from './TutorRepository'
import type { PetRepository } from '../pets/PetRepository'

export class TutorValidationError extends Error {
  readonly fields: TutorErrors
  constructor(fields: TutorErrors) {
    super('Revisa los campos señalados para continuar.')
    this.fields = fields
  }
}

export class TutorService {
  private readonly repository: TutorRepository
  private readonly createId: () => string
  private readonly pets?: PetRepository
  constructor(
    repository: TutorRepository,
    createId: () => string,
    pets?: PetRepository,
  ) {
    this.repository = repository
    this.createId = createId
    this.pets = pets
  }
  async list() {
    const tutors = await this.repository.list()
    if (!this.pets) return tutors
    const pets = await this.pets.list()
    return tutors.map((tutor) => ({
      ...tutor,
      pets: pets
        .filter((pet) => pet.tutorId === tutor.id)
        .map((pet) => ({ id: pet.id, name: pet.name, species: pet.species })),
    }))
  }
  async save(input: TutorInput, id?: string): Promise<Tutor> {
    const data = normalizeTutor(input)
    const errors = validateTutor(data)
    if (Object.keys(errors).length) throw new TutorValidationError(errors)
    const tutors = await this.list()
    if (tutors.some((tutor) => tutor.dni === data.dni && tutor.id !== id))
      errors.dni = 'Ya existe un tutor registrado con este DNI.'
    if (Object.keys(errors).length) throw new TutorValidationError(errors)
    const existing = id ? tutors.find((tutor) => tutor.id === id) : undefined
    if (id && !existing)
      throw new Error('Este tutor ya no está disponible. Actualiza el listado.')
    const tutor: Tutor = {
      ...data,
      id: existing?.id ?? this.createId(),
      pets: existing?.pets ?? [],
    }
    await this.repository.save(tutor)
    return tutor
  }
}
