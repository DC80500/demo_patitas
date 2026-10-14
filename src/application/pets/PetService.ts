import {
  normalizePet,
  validatePet,
  type Pet,
  type PetInput,
  type PetErrors,
} from '../../domain/pets/Pet.ts'
import type { PetRepository } from './PetRepository'
import type { TutorRepository } from '../tutors/TutorRepository'

export class PetValidationError extends Error {
  readonly fields: PetErrors
  constructor(fields: PetErrors) {
    super('Revisa los campos señalados para continuar.')
    this.fields = fields
  }
}
export class PetService {
  private readonly repository: PetRepository
  private readonly tutors: TutorRepository
  private readonly createId: () => string
  constructor(
    repository: PetRepository,
    tutors: TutorRepository,
    createId: () => string,
  ) {
    this.repository = repository
    this.tutors = tutors
    this.createId = createId
  }
  list() {
    return this.repository.list()
  }
  async save(input: PetInput, id?: string): Promise<Pet> {
    const data = normalizePet(input)
    const errors = validatePet(data)
    if (Object.keys(errors).length) throw new PetValidationError(errors)
    if (!(await this.tutors.list()).some((tutor) => tutor.id === data.tutorId))
      throw new PetValidationError({
        tutorId: 'Selecciona un tutor registrado.',
      })
    const pets = await this.repository.list()
    const existing = id ? pets.find((pet) => pet.id === id) : undefined
    if (id && !existing)
      throw new Error('La mascota ya no está disponible. Actualiza el listado.')
    if (
      data.microchip &&
      pets.some((pet) => pet.microchip === data.microchip && pet.id !== id)
    )
      throw new PetValidationError({
        microchip: 'Este microchip ya está asociado a otra mascota.',
      })
    const nextNumber =
      Math.max(
        0,
        ...pets.map((pet) => Number(pet.registration.replace('PA-', ''))),
      ) + 1
    const pet: Pet = {
      ...data,
      id: existing?.id ?? this.createId(),
      registration:
        existing?.registration ?? `PA-${String(nextNumber).padStart(6, '0')}`,
      status: 'Pendiente',
    }
    await this.repository.save(pet)
    return pet
  }
  async approve(id: string): Promise<Pet> {
    const pet = (await this.repository.list()).find((item) => item.id === id)
    if (!pet) throw new Error('La mascota ya no está disponible.')
    if (!(await this.tutors.list()).some((tutor) => tutor.id === pet.tutorId))
      throw new Error('Asocia un tutor válido antes de aprobar el registro.')
    const errors = validatePet(pet)
    if (Object.keys(errors).length) throw new PetValidationError(errors)
    const approved: Pet = { ...pet, status: 'Aprobado' }
    await this.repository.save(approved)
    return approved
  }
}
