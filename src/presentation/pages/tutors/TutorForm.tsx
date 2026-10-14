import { useState, type FormEvent } from 'react'
import type {
  Tutor,
  TutorInput,
  TutorErrors,
} from '../../../domain/tutors/Tutor'
import {
  TutorService,
  TutorValidationError,
} from '../../../application/tutors/TutorService'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'

const fields: {
  key: keyof TutorInput
  label: string
  placeholder: string
  type?: string
  max: number
  autoComplete: string
}[] = [
  {
    key: 'firstName',
    label: 'Nombres',
    placeholder: 'Nombres del tutor',
    max: 80,
    autoComplete: 'given-name',
  },
  {
    key: 'lastName',
    label: 'Apellidos',
    placeholder: 'Apellidos del tutor',
    max: 80,
    autoComplete: 'family-name',
  },
  {
    key: 'dni',
    label: 'DNI',
    placeholder: '8 dígitos',
    max: 8,
    autoComplete: 'off',
  },
  {
    key: 'phone',
    label: 'Celular',
    placeholder: '9 dígitos',
    type: 'tel',
    max: 9,
    autoComplete: 'tel-national',
  },
  {
    key: 'email',
    label: 'Correo electrónico',
    placeholder: 'nombre@correo.com',
    type: 'email',
    max: 254,
    autoComplete: 'email',
  },
  {
    key: 'district',
    label: 'Distrito',
    placeholder: 'Ej. Miraflores',
    max: 80,
    autoComplete: 'address-level2',
  },
  {
    key: 'address',
    label: 'Dirección',
    placeholder: 'Calle, número y referencia',
    max: 180,
    autoComplete: 'street-address',
  },
]
const empty: TutorInput = {
  firstName: '',
  lastName: '',
  dni: '',
  phone: '',
  email: '',
  district: '',
  address: '',
}

export function TutorForm({
  tutor,
  service,
  onSaved,
  onClose,
}: {
  tutor?: Tutor
  service: TutorService
  onSaved: (tutor: Tutor) => void
  onClose: () => void
}) {
  const [values, setValues] = useState<TutorInput>(tutor ?? empty)
  const [errors, setErrors] = useState<TutorErrors>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setMessage('')
    setErrors({})
    try {
      onSaved(await service.save(values, tutor?.id))
    } catch (error) {
      if (error instanceof TutorValidationError) setErrors(error.fields)
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el registro.',
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal
      title={tutor ? 'Editar tutor' : 'Registrar tutor'}
      onClose={() => {
        if (!saving) onClose()
      }}
    >
      <form
        onSubmit={submit}
        noValidate
        aria-label={tutor ? 'Editar tutor' : 'Registrar tutor'}
      >
        <div className="modal-body">
          <p className="muted mb-6 text-sm">
            Completa los datos de la persona responsable. Todos los campos son
            obligatorios.
          </p>
          {message && (
            <p className="form-error mb-5" role="alert">
              {message}
            </p>
          )}
          <div className="grid grid-cols-1 gap-5 min-[601px]:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.key}
                className={`field ${field.key === 'address' ? 'min-[601px]:col-span-2' : ''}`}
              >
                <label htmlFor={`tutor-${field.key}`}>{field.label}</label>
                <div
                  className={`input-wrap ${errors[field.key] ? 'input-invalid' : ''}`}
                >
                  <input
                    id={`tutor-${field.key}`}
                    name={field.key}
                    type={field.type ?? 'text'}
                    value={values[field.key]}
                    placeholder={field.placeholder}
                    maxLength={field.max}
                    autoComplete={field.autoComplete}
                    inputMode={
                      ['dni', 'phone'].includes(field.key)
                        ? 'numeric'
                        : undefined
                    }
                    required
                    disabled={saving}
                    aria-invalid={Boolean(errors[field.key])}
                    aria-describedby={
                      errors[field.key] ? `error-${field.key}` : undefined
                    }
                    onChange={(event) => {
                      const value = ['dni', 'phone'].includes(field.key)
                        ? event.target.value.replace(/\D/g, '')
                        : event.target.value
                      setValues((current) => ({
                        ...current,
                        [field.key]: value,
                      }))
                      setErrors((current) => ({
                        ...current,
                        [field.key]: undefined,
                      }))
                      setMessage('')
                    }}
                  />
                </div>
                {errors[field.key] && (
                  <p
                    id={`error-${field.key}`}
                    className="mt-2 text-xs text-[#a01d29]"
                  >
                    {errors[field.key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={saving}
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
            {saving
              ? 'Guardando…'
              : tutor
                ? 'Guardar cambios'
                : 'Registrar tutor'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
