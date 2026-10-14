export interface ClinicalInput {
  petId: string
  kind: 'Consulta' | 'Vacuna'
  date: string
  veterinarian: string
  reason: string
  diagnosis: string
  treatment: string
  vaccine: string
  notes: string
  nextVisit: string
}
export interface ClinicalEntry extends ClinicalInput {
  id: string
}
export type ClinicalErrors = Partial<Record<keyof ClinicalInput, string>>

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}
export function normalizeClinical(input: ClinicalInput): ClinicalInput {
  return {
    ...input,
    petId: input.petId.trim(),
    veterinarian: input.veterinarian.trim(),
    reason: input.kind === 'Consulta' ? input.reason.trim() : '',
    diagnosis: input.kind === 'Consulta' ? input.diagnosis.trim() : '',
    treatment: input.kind === 'Consulta' ? input.treatment.trim() : '',
    vaccine: input.kind === 'Vacuna' ? input.vaccine.trim() : '',
    notes: input.notes.trim(),
  }
}
export function validateClinical(
  input: ClinicalInput,
  today?: string,
): ClinicalErrors {
  const errors: ClinicalErrors = {}
  if (!input.petId) errors.petId = 'Selecciona una mascota registrada.'
  if (!['Consulta', 'Vacuna'].includes(input.kind))
    errors.kind = 'Selecciona el tipo de atención.'
  if (!isCalendarDate(input.date)) errors.date = 'Ingresa una fecha válida.'
  else if (today && input.date > today)
    errors.date = 'La atención no puede tener una fecha futura.'
  if (
    input.nextVisit &&
    (!isCalendarDate(input.nextVisit) || input.nextVisit < input.date)
  )
    errors.nextVisit =
      'El próximo control debe ser igual o posterior a la atención.'
  const required: (keyof ClinicalInput)[] = [
    'veterinarian',
    ...(input.kind === 'Consulta'
      ? (['reason', 'diagnosis'] as const)
      : (['vaccine'] as const)),
  ]
  for (const key of required)
    if (!input[key]) errors[key] = 'Este campo es obligatorio.'
  for (const key of [
    'veterinarian',
    'reason',
    'diagnosis',
    'treatment',
    'vaccine',
    'notes',
  ] as const)
    if (
      input[key].length >
      (['veterinarian', 'vaccine'].includes(key) ? 180 : 1500)
    )
      errors[key] = 'El texto es demasiado largo.'
  return errors
}
