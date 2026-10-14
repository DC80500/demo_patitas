export interface TutorInput {
  firstName: string
  lastName: string
  dni: string
  phone: string
  email: string
  address: string
  district: string
}

export interface TutorPet {
  id: string
  name: string
  species: 'Perro' | 'Gato' | 'Otro'
}

export interface Tutor extends TutorInput {
  id: string
  pets: TutorPet[]
}

export type TutorErrors = Partial<Record<keyof TutorInput, string>>

export function normalizeTutor(input: TutorInput): TutorInput {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dni: input.dni.trim(),
    phone: input.phone.replace(/[\s-]/g, ''),
    email: input.email.trim().toLowerCase(),
    address: input.address.trim(),
    district: input.district.trim(),
  }
}

export function validateTutor(input: TutorInput): TutorErrors {
  const errors: TutorErrors = {}
  for (const field of [
    'firstName',
    'lastName',
    'address',
    'district',
  ] as const) {
    if (!input[field]) errors[field] = 'Este campo es obligatorio.'
    else if (input[field].length > (field === 'address' ? 180 : 80))
      errors[field] = 'El texto es demasiado largo.'
  }
  if (!/^\d{8}$/.test(input.dni)) errors.dni = 'Ingresa un DNI de 8 dígitos.'
  if (!/^9\d{8}$/.test(input.phone))
    errors.phone = 'Ingresa un celular de 9 dígitos que comience con 9.'
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) ||
    input.email.length > 254
  )
    errors.email = 'Ingresa un correo electrónico válido.'
  return errors
}
