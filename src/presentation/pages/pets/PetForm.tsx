import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  normalizePet,
  validatePet,
  speciesOptions,
  type Pet,
  type PetInput,
  type PetErrors,
} from '../../../domain/pets/Pet'
import type { Tutor } from '../../../domain/tutors/Tutor'
import {
  PetService,
  PetValidationError,
} from '../../../application/pets/PetService'
import { preparePetPhoto } from '../../utils/preparePetPhoto'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'
import { PetAvatar } from './PetAvatar'
import { formatPetAge } from '../../utils/formatPetAge'

const empty: PetInput = {
  tutorId: '',
  name: '',
  species: 'Perro',
  breed: '',
  sex: 'Hembra',
  age: 0,
  ageUnit: 'años',
  color: '',
  photo: '',
  microchip: '',
  vaccines: '',
  sterilized: 'No informado',
  notes: '',
  vetName: '',
  vetPhone: '',
  vetAddress: '',
}
const stepFields: (keyof PetInput)[][] = [
  [
    'tutorId',
    'name',
    'species',
    'breed',
    'sex',
    'age',
    'ageUnit',
    'color',
    'photo',
  ],
  [
    'microchip',
    'vaccines',
    'sterilized',
    'notes',
    'vetName',
    'vetPhone',
    'vetAddress',
  ],
]

export function PetForm({
  pet,
  tutors,
  service,
  onSaved,
  onClose,
  initialTutorId,
}: {
  pet?: Pet
  tutors: Tutor[]
  service: PetService
  onSaved: (pet: Pet) => void
  onClose: () => void
  initialTutorId?: string
}) {
  const [values, setValues] = useState<PetInput>(
    pet ?? { ...empty, tutorId: initialTutorId ?? '' },
  )
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<PetErrors>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const stepDescription = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    stepDescription.current?.closest('dialog')?.scrollTo({ top: 0 })
    stepDescription.current?.focus({ preventScroll: true })
  }, [step])
  const selectedTutor = tutors.find((tutor) => tutor.id === values.tutorId)
  function update<K extends keyof PetInput>(key: K, value: PetInput[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setMessage('')
  }
  function next() {
    const all = validatePet(normalizePet(values))
    const relevant = Object.fromEntries(
      Object.entries(all).filter(([key]) =>
        stepFields[step].includes(key as keyof PetInput),
      ),
    )
    setErrors(relevant)
    if (Object.keys(relevant).length) {
      setMessage('Revisa los campos señalados.')
      return
    }
    setMessage('')
    setStep((current) => current + 1)
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || photoBusy) return
    if (step < 2) {
      next()
      return
    }
    setSaving(true)
    setMessage('')
    setErrors({})
    try {
      onSaved(await service.save(values, pet?.id))
    } catch (error) {
      if (error instanceof PetValidationError) {
        setErrors(error.fields)
        const first = Object.keys(error.fields)[0] as keyof PetInput
        setStep(stepFields[0].includes(first) ? 0 : 1)
      }
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la mascota.',
      )
    } finally {
      setSaving(false)
    }
  }
  function errorFor(key: keyof PetInput) {
    return (
      errors[key] && (
        <p id={`pet-error-${key}`} className="mt-2 text-xs text-[#a01d29]">
          {errors[key]}
        </p>
      )
    )
  }
  function textField(
    key:
      | 'name'
      | 'breed'
      | 'color'
      | 'microchip'
      | 'vetName'
      | 'vetPhone'
      | 'vetAddress',
    label: string,
    required = false,
  ) {
    return (
      <div className="field">
        <label htmlFor={`pet-${key}`}>
          {label}
          {required ? ' *' : ''}
        </label>
        <div className={`input-wrap ${errors[key] ? 'input-invalid' : ''}`}>
          <input
            id={`pet-${key}`}
            value={values[key]}
            disabled={saving}
            required={required}
            type={key === 'vetPhone' ? 'tel' : 'text'}
            inputMode={key === 'vetPhone' ? 'numeric' : undefined}
            maxLength={
              key === 'microchip'
                ? 30
                : key === 'vetPhone'
                  ? 9
                  : key === 'vetAddress' || key === 'vetName'
                    ? 180
                    : 100
            }
            aria-invalid={Boolean(errors[key])}
            aria-describedby={errors[key] ? `pet-error-${key}` : undefined}
            onChange={(event) =>
              update(
                key,
                key === 'vetPhone'
                  ? event.target.value.replace(/\D/g, '')
                  : event.target.value,
              )
            }
          />
        </div>
        {errorFor(key)}
      </div>
    )
  }
  function selectField(
    key: 'species' | 'sex' | 'ageUnit' | 'sterilized',
    label: string,
    options: readonly string[],
  ) {
    return (
      <div className="field">
        <label htmlFor={`pet-${key}`}>{label}</label>
        <select
          id={`pet-${key}`}
          className="form-select"
          value={values[key]}
          disabled={saving}
          onChange={(event) =>
            update(key, event.target.value as PetInput[typeof key])
          }
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errorFor(key)}
      </div>
    )
  }
  return (
    <Modal
      title={pet ? 'Editar mascota' : 'Registrar mascota'}
      eyebrow="GESTIÓN DE MASCOTAS"
      onClose={() => {
        if (!saving && !photoBusy) onClose()
      }}
    >
      <form
        onSubmit={submit}
        noValidate
        aria-label={pet ? 'Editar mascota' : 'Registrar mascota'}
      >
        <div className="modal-body">
          <ol className="form-steps" aria-label="Pasos del registro">
            {['Identificación', 'Salud y veterinario', 'Revisión'].map(
              (label, index) => (
                <li
                  key={label}
                  aria-current={step === index ? 'step' : undefined}
                  className={
                    step === index ? 'current' : step > index ? 'completed' : ''
                  }
                >
                  <span>{index + 1}</span>
                  {label}
                </li>
              ),
            )}
          </ol>
          <p
            ref={stepDescription}
            tabIndex={-1}
            className="muted mb-5 text-sm outline-none"
          >
            {step === 0
              ? 'Selecciona un tutor y completa los campos marcados con *. La fotografía es opcional.'
              : step === 1
                ? 'Añade lo que conozcas sobre su salud y su veterinario. Estos datos son opcionales.'
                : 'Revisa los datos antes de guardar. El registro quedará pendiente de aprobación.'}
          </p>
          {pet?.status === 'Aprobado' && (
            <p className="review-note mb-5">
              Al guardar cambios, la mascota volverá a quedar pendiente de
              aprobación.
            </p>
          )}
          {message && (
            <p className="form-error mb-5" role="alert">
              {message}
            </p>
          )}
          {step === 0 && (
            <>
              <div className="photo-upload">
                <PetAvatar
                  name={values.name || 'la mascota'}
                  photo={values.photo}
                  large
                />
                <div>
                  <label htmlFor="pet-photo" className="upload-label">
                    {photoBusy ? 'Procesando fotografía…' : 'Añadir fotografía'}
                  </label>
                  <input
                    id="pet-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={saving || photoBusy}
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      setPhotoBusy(true)
                      setMessage('')
                      try {
                        update('photo', await preparePetPhoto(file))
                      } catch (cause) {
                        setMessage(
                          cause instanceof Error
                            ? cause.message
                            : 'No se pudo cargar la fotografía.',
                        )
                      } finally {
                        setPhotoBusy(false)
                        event.target.value = ''
                      }
                    }}
                  />
                  <p className="muted mt-2 text-xs">
                    JPG, PNG o WebP · Hasta 5 MB
                  </p>
                  {values.photo && (
                    <button
                      type="button"
                      className="small-link"
                      onClick={() => update('photo', '')}
                      disabled={photoBusy}
                    >
                      Quitar fotografía
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 min-[601px]:grid-cols-2">
                <div className="field min-[601px]:col-span-2">
                  <label htmlFor="pet-tutorId">Tutor responsable *</label>
                  <select
                    id="pet-tutorId"
                    className={`form-select ${errors.tutorId ? 'input-invalid' : ''}`}
                    value={values.tutorId}
                    onChange={(event) => update('tutorId', event.target.value)}
                    required
                    aria-invalid={Boolean(errors.tutorId)}
                    aria-describedby={
                      errors.tutorId ? 'pet-error-tutorId' : undefined
                    }
                  >
                    <option value="">Selecciona un tutor</option>
                    {tutors.map((tutor) => (
                      <option key={tutor.id} value={tutor.id}>
                        {tutor.firstName} {tutor.lastName} · DNI {tutor.dni}
                      </option>
                    ))}
                  </select>
                  {errorFor('tutorId')}
                </div>
                {textField('name', 'Nombre', true)}
                {selectField('species', 'Especie', speciesOptions)}
                {textField('breed', 'Raza (o mestizo)', true)}
                {selectField('sex', 'Sexo', ['Hembra', 'Macho'])}
                <div className="field">
                  <label htmlFor="pet-age">Edad *</label>
                  <div
                    className={`input-wrap ${errors.age ? 'input-invalid' : ''}`}
                  >
                    <input
                      id="pet-age"
                      type="number"
                      min="0"
                      max={values.ageUnit === 'años' ? 40 : 480}
                      step="1"
                      value={Number.isNaN(values.age) ? '' : values.age}
                      onChange={(event) =>
                        update(
                          'age',
                          event.target.value === ''
                            ? NaN
                            : Number(event.target.value),
                        )
                      }
                      aria-invalid={Boolean(errors.age)}
                      aria-describedby={
                        errors.age ? 'pet-error-age' : undefined
                      }
                      required
                    />
                  </div>
                  {errorFor('age')}
                </div>
                {selectField('ageUnit', 'Unidad de edad', ['años', 'meses'])}
                {textField('color', 'Color', true)}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h3 className="form-section-title">
                Salud e identificación adicional
              </h3>
              <div className="grid grid-cols-1 gap-5 min-[601px]:grid-cols-2">
                {textField('microchip', 'Microchip (si tiene)')}
                {selectField('sterilized', 'Esterilización', [
                  'No informado',
                  'Sí',
                  'No',
                ])}
                {(['vaccines', 'notes'] as const).map((key) => (
                  <div className="field min-[601px]:col-span-2" key={key}>
                    <label htmlFor={`pet-${key}`}>
                      {key === 'vaccines'
                        ? 'Vacunas'
                        : 'Otras características y observaciones'}
                    </label>
                    <textarea
                      id={`pet-${key}`}
                      className="form-textarea"
                      rows={3}
                      maxLength={1000}
                      value={values[key]}
                      onChange={(event) => update(key, event.target.value)}
                    />
                    {errorFor(key)}
                  </div>
                ))}
              </div>
              <h3 className="form-section-title mt-6">Veterinario habitual</h3>
              <div className="grid grid-cols-1 gap-5 min-[601px]:grid-cols-2">
                {textField('vetName', 'Nombre del veterinario')}
                {textField('vetPhone', 'Celular del veterinario')}
                <div className="min-[601px]:col-span-2">
                  {textField('vetAddress', 'Dirección de atención')}
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <div className="registration-review">
              <div className="flex items-center gap-4">
                <PetAvatar name={values.name} photo={values.photo} large />
                <div>
                  <h3 className="text-xl font-semibold">{values.name}</h3>
                  <p className="muted text-sm">
                    {values.species} · {values.breed} · {values.sex}
                  </p>
                </div>
              </div>
              <dl className="detail-grid">
                {[
                  [
                    'Tutor',
                    selectedTutor
                      ? `${selectedTutor.firstName} ${selectedTutor.lastName}`
                      : 'Sin seleccionar',
                  ],
                  ['DNI del tutor', selectedTutor?.dni ?? '—'],
                  ['Edad', formatPetAge(values)],
                  ['Color', values.color],
                  ['Esterilización', values.sterilized],
                  ['Microchip', values.microchip || 'No informado'],
                  ['Vacunas', values.vaccines || 'No informadas'],
                  ['Veterinario', values.vetName || 'No informado'],
                  [
                    'Celular del veterinario',
                    values.vetPhone || 'No informado',
                  ],
                  [
                    'Dirección de atención',
                    values.vetAddress || 'No informada',
                  ],
                  ['Observaciones', values.notes || 'Sin observaciones'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            disabled={saving || photoBusy}
            onClick={() =>
              step === 0 ? onClose() : setStep((current) => current - 1)
            }
          >
            {step === 0 ? 'Cancelar' : 'Atrás'}
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={saving || photoBusy}
            aria-busy={saving}
          >
            <Icon name={step === 2 ? 'check' : 'arrow'} />
            {saving
              ? 'Guardando…'
              : step < 2
                ? 'Continuar'
                : pet
                  ? 'Guardar cambios'
                  : 'Registrar mascota'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
