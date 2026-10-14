import {
  normalizeClinical,
  validateClinical,
  type ClinicalEntry,
  type ClinicalInput,
  type ClinicalErrors,
} from '../../domain/clinical/ClinicalEntry.ts'
import type { ClinicalRepository } from './ClinicalRepository'
import type { PetRepository } from '../pets/PetRepository'
export class ClinicalValidationError extends Error {
  readonly fields: ClinicalErrors
  constructor(fields: ClinicalErrors) {
    super('Revisa los campos señalados para continuar.')
    this.fields = fields
  }
}
export class ClinicalService {
  private readonly repository: ClinicalRepository
  private readonly pets: PetRepository
  private readonly createId: () => string
  private readonly today: () => string
  constructor(
    repository: ClinicalRepository,
    pets: PetRepository,
    createId: () => string,
    today: () => string,
  ) {
    this.repository = repository
    this.pets = pets
    this.createId = createId
    this.today = today
  }
  list() {
    return this.repository.list()
  }
  async register(input: ClinicalInput): Promise<ClinicalEntry> {
    const data = normalizeClinical(input)
    const errors = validateClinical(data, this.today())
    if (Object.keys(errors).length) throw new ClinicalValidationError(errors)
    if (!(await this.pets.list()).some((pet) => pet.id === data.petId))
      throw new ClinicalValidationError({
        petId: 'Esta mascota ya no está disponible. Actualiza el listado.',
      })
    const entry: ClinicalEntry = { ...data, id: this.createId() }
    await this.repository.save(entry)
    return entry
  }
}
