import type { PetInput } from '../../domain/pets/Pet'

export function formatPetAge(pet: Pick<PetInput, 'age' | 'ageUnit'>): string {
  const unit =
    pet.age === 1 ? (pet.ageUnit === 'años' ? 'año' : 'mes') : pet.ageUnit
  return `${pet.age} ${unit}`
}
