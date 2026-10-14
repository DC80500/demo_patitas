import { useState, type FormEvent } from 'react'
import type { Pet } from '../../../domain/pets/Pet'
import type {
  ClinicalInput,
  ClinicalEntry,
  ClinicalErrors,
} from '../../../domain/clinical/ClinicalEntry'
import {
  ClinicalValidationError,
  type ClinicalService,
} from '../../../application/clinical/ClinicalService'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { localToday } from '../../utils/calendarDate'

export function ClinicalForm({
  pet,
  kind,
  service,
  onSaved,
  onClose,
}: {
  pet: Pet
  kind: ClinicalInput['kind']
  service: ClinicalService
  onSaved: (entry: ClinicalEntry) => void
  onClose: () => void
}) {
  const [values, setValues] = useState<ClinicalInput>({
    petId: pet.id,
    kind,
    date: localToday(),
    veterinarian: pet.vetName,
    reason: '',
    diagnosis: '',
    treatment: '',
    vaccine: '',
    notes: '',
    nextVisit: '',
  })
  const [errors, setErrors] = useState<ClinicalErrors>({}),
    [message, setMessage] = useState(''),
    [saving, setSaving] = useState(false)
  function update<K extends keyof ClinicalInput>(
    key: K,
    value: ClinicalInput[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setMessage('')
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setErrors({})
    setMessage('')
    try {
      onSaved(await service.register(values))
    } catch (cause) {
      if (cause instanceof ClinicalValidationError) setErrors(cause.fields)
      setMessage(
        cause instanceof Error
          ? cause.message
          : 'No se pudo guardar la atención.',
      )
    } finally {
      setSaving(false)
    }
  }
  function field(
    key:
      | 'date'
      | 'veterinarian'
      | 'reason'
      | 'diagnosis'
      | 'treatment'
      | 'vaccine'
      | 'notes'
      | 'nextVisit',
    label: string,
    required = false,
    multiline = false,
  ) {
    const id = `clinical-${key}`
    const shared = {
      id,
      value: values[key],
      disabled: saving,
      required,
      'aria-invalid': Boolean(errors[key]),
      'aria-describedby': errors[key] ? `${id}-error` : undefined,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => update(key, event.target.value),
    }
    return (
      <div className={`field ${multiline ? 'min-[601px]:col-span-2' : ''}`}>
        <label htmlFor={id}>
          {label}
          {required ? ' *' : ''}
        </label>
        {multiline ? (
          <textarea
            {...shared}
            className={`form-textarea ${errors[key] ? 'input-invalid' : ''}`}
            rows={3}
            maxLength={1500}
          />
        ) : (
          <div className={`input-wrap ${errors[key] ? 'input-invalid' : ''}`}>
            <input
              {...shared}
              type={key === 'date' || key === 'nextVisit' ? 'date' : 'text'}
              onInput={
                key === 'date' || key === 'nextVisit'
                  ? (event) => update(key, event.currentTarget.value)
                  : undefined
              }
              max={key === 'date' ? localToday() : undefined}
              min={key === 'nextVisit' ? values.date : undefined}
              maxLength={
                key === 'vaccine' || key === 'veterinarian' ? 180 : 1500
              }
            />
          </div>
        )}
        {errors[key] && (
          <p id={`${id}-error`} className="mt-2 text-xs text-[#a01d29]">
            {errors[key]}
          </p>
        )}
      </div>
    )
  }
  return (
    <Modal
      title={kind === 'Consulta' ? 'Registrar consulta' : 'Registrar vacuna'}
      eyebrow="HISTORIA CLÍNICA"
      onClose={() => {
        if (!saving) onClose()
      }}
    >
      <form
        noValidate
        onSubmit={submit}
        aria-label={
          kind === 'Consulta' ? 'Registrar consulta' : 'Registrar vacuna'
        }
      >
        <div className="modal-body">
          <p className="clinical-form-pet">
            <Icon name="paw" />
            <span>
              <strong>{pet.name}</strong> · {pet.registration}
            </span>
          </p>
          <p className="muted my-5 text-sm">
            Completa los campos marcados con *. Los datos quedarán vinculados a
            esta mascota.
          </p>
          {message && (
            <p className="form-error mb-5" role="alert">
              {message}
            </p>
          )}
          <div className="grid grid-cols-1 gap-5 min-[601px]:grid-cols-2">
            {field('date', 'Fecha de atención', true)}
            {field('veterinarian', 'Veterinario', true)}
            {kind === 'Consulta' ? (
              <>
                {field('reason', 'Motivo de consulta', true, true)}
                {field('diagnosis', 'Diagnóstico', true, true)}
                {field('treatment', 'Tratamiento', false, true)}
              </>
            ) : (
              field('vaccine', 'Vacuna aplicada', true)
            )}
            {field(
              'nextVisit',
              kind === 'Consulta'
                ? 'Próximo control'
                : 'Próximo control o refuerzo',
            )}
            {field('notes', 'Observaciones', false, true)}
          </div>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            disabled={saving}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={saving}
            aria-busy={saving}
          >
            <Icon name="check" />
            {saving ? 'Guardando…' : 'Guardar atención'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
