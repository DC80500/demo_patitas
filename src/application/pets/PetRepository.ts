import type { Pet } from '../../domain/pets/Pet'
export interface PetRepository {
  list(): Promise<Pet[]>
  save(pet: Pet): Promise<void>
}
