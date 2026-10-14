export const speciesOptions = ['Perro', 'Gato', 'Otro'] as const
export type Species = (typeof speciesOptions)[number]
export interface PetInput {
  tutorId: string
  name: string
  species: Species
  breed: string
  sex: 'Macho' | 'Hembra'
  age: number
  ageUnit: 'años' | 'meses'
  color: string
  photo: string
  microchip: string
  vaccines: string
  sterilized: 'Sí' | 'No' | 'No informado'
  notes: string
  vetName: string
  vetPhone: string
  vetAddress: string
}
export interface Pet extends PetInput {
  id: string
  registration: string
  status: 'Pendiente' | 'Aprobado'
}
export type PetErrors = Partial<Record<keyof PetInput, string>>
export function normalizePet(input: PetInput): PetInput {
  return {
    ...input,
    tutorId: input.tutorId.trim(),
    name: input.name.trim(),
    breed: input.breed.trim(),
    color: input.color.trim(),
    microchip: input.microchip.trim(),
    vaccines: input.vaccines.trim(),
    notes: input.notes.trim(),
    vetName: input.vetName.trim(),
    vetPhone: input.vetPhone.replace(/[\s-]/g, ''),
    vetAddress: input.vetAddress.trim(),
  }
}
export function validatePet(input: PetInput): PetErrors {
  const errors: PetErrors = {}
  for (const field of ['tutorId', 'name', 'breed', 'color'] as const) {
    if (!input[field]) errors[field] = 'Este campo es obligatorio.'
    else if (input[field].length > 100)
      errors[field] = 'El texto es demasiado largo.'
  }
  if (!speciesOptions.includes(input.species))
    errors.species = 'Selecciona una especie.'
  if (!['Macho', 'Hembra'].includes(input.sex))
    errors.sex = 'Selecciona el sexo.'
  if (
    !Number.isInteger(input.age) ||
    input.age < 0 ||
    input.age > (input.ageUnit === 'años' ? 40 : 480)
  )
    errors.age = 'Ingresa una edad válida, entre 0 y 40 años (o 480 meses).'
  if (!['años', 'meses'].includes(input.ageUnit))
    errors.ageUnit = 'Selecciona la unidad de edad.'
  if (!['Sí', 'No', 'No informado'].includes(input.sterilized))
    errors.sterilized = 'Selecciona una opción.'
  if (input.vetPhone && !/^9\d{8}$/.test(input.vetPhone))
    errors.vetPhone = 'Ingresa un celular de 9 dígitos que comience con 9.'
  if (input.microchip.length > 30)
    errors.microchip = 'El microchip admite hasta 30 caracteres.'
  for (const field of ['vaccines', 'notes', 'vetName', 'vetAddress'] as const) {
    if (
      input[field].length > (['vaccines', 'notes'].includes(field) ? 1000 : 180)
    )
      errors[field] = 'El texto es demasiado largo.'
  }
  if (
    input.photo &&
    (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(
      input.photo,
    ) ||
      input.photo.length > 1000000)
  )
    errors.photo = 'La fotografía no es válida o es demasiado grande.'
  return errors
}
