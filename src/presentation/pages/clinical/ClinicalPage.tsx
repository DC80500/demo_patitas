import { useEffect, useRef, useState } from 'react'
import type { Pet } from '../../../domain/pets/Pet'
import type { Tutor } from '../../../domain/tutors/Tutor'
import type {
  ClinicalEntry,
  ClinicalInput,
} from '../../../domain/clinical/ClinicalEntry'
import type { ClinicalService } from '../../../application/clinical/ClinicalService'
import type { PetService } from '../../../application/pets/PetService'
import type { TutorService } from '../../../application/tutors/TutorService'
import { Icon } from '../../components/Icon'
import { PetAvatar } from '../pets/PetAvatar'
import { ClinicalForm } from './ClinicalForm'
import { formatPetAge } from '../../utils/formatPetAge'
import { formatCalendarDate, localToday } from '../../utils/calendarDate'

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
export function ClinicalPage({
  service,
  petService,
  tutorService,
  initialPetId,
}: {
  service: ClinicalService
  petService: PetService
  tutorService: TutorService
  initialPetId?: string
}) {
  const [pets, setPets] = useState<Pet[]>([]),
    [tutors, setTutors] = useState<Tutor[]>([]),
    [entries, setEntries] = useState<ClinicalEntry[]>([])
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0)
  const [selectedId, setSelectedId] = useState(initialPetId ?? ''),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('Todas'),
    [notice, setNotice] = useState(''),
    [form, setForm] = useState<ClinicalInput['kind'] | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    let active = true
    Promise.all([petService.list(), tutorService.list(), service.list()])
      .then(([animals, owners, records]) => {
        if (active) {
          setPets(animals)
          setTutors(owners)
          setEntries(records)
          setSelectedId((current) =>
            animals.some((pet) => pet.id === current)
              ? current
              : (animals[0]?.id ?? ''),
          )
          setError('')
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'No se pudo cargar la historia clínica.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [service, petService, tutorService, retry])
  const selected = pets.find((pet) => pet.id === selectedId)
  const owner = selected
    ? tutors.find((tutor) => tutor.id === selected.tutorId)
    : undefined
  const matches = pets.filter((pet) => {
    const tutor = tutors.find((item) => item.id === pet.tutorId)
    return normalize(
      `${pet.name} ${pet.registration} ${tutor?.dni ?? ''}`,
    ).includes(normalize(query.trim()))
  })
  const history = entries
    .filter((entry) => entry.petId === selectedId)
    .reverse()
    .sort((a, b) => b.date.localeCompare(a.date))
  const visible = history.filter(
    (entry) => filter === 'Todas' || entry.kind === filter,
  )
  const nextVisit = history
    .map((entry) => entry.nextVisit)
    .filter((date) => date && date >= localToday())
    .sort()[0]
  function saved(entry: ClinicalEntry) {
    setEntries((current) => [...current, entry])
    setFilter('Todas')
    setForm(null)
    setNotice(
      `${entry.kind === 'Consulta' ? 'Consulta' : 'Vacuna'} registrada para ${selected?.name ?? 'la mascota'}.`,
    )
  }
  return (
    <section aria-labelledby="clinical-title">
      <div className="tutors-heading">
        <div>
          <p className="eyebrow">ACOMPAÑAMOS SU BIENESTAR</p>
          <h1
            ref={heading}
            tabIndex={-1}
            id="clinical-title"
            className="mt-2 text-[clamp(1.8rem,3vw,2.5rem)] font-bold tracking-tight"
          >
            Historia Clínica
          </h1>
          <p className="muted mt-2 text-sm">
            Consultas, vacunas y seguimiento de cada mascota.
          </p>
        </div>
      </div>
      {notice && (
        <div className="success-notice mt-6" role="status">
          <Icon name="check" />
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Cerrar aviso"
            onClick={() => setNotice('')}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      {loading ? (
        <div className="list-state" role="status">
          Cargando historia clínica…
        </div>
      ) : error ? (
        <div className="list-state" role="alert">
          <p>{error}</p>
          <button
            className="button secondary"
            onClick={() => {
              setLoading(true)
              setRetry((current) => current + 1)
            }}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="clinical-layout">
          <aside className="clinical-selector" aria-label="Seleccionar mascota">
            <h2 className="text-lg font-semibold">Sus historias</h2>
            <p className="muted mt-2 mb-4 text-xs">
              Busca por nombre, registro o DNI del tutor.
            </p>
            <label className="search-field">
              <Icon name="search" />
              <input
                aria-label="Buscar mascota para historia clínica"
                placeholder="Nombre, registro o DNI"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="clinical-pet-list">
              {matches.map((pet) => (
                <button
                  className={`clinical-pet-option ${pet.id === selectedId ? 'selected' : ''}`}
                  key={pet.id}
                  aria-pressed={pet.id === selectedId}
                  onClick={() => {
                    setSelectedId(pet.id)
                    setFilter('Todas')
                    setNotice('')
                  }}
                >
                  <PetAvatar name={pet.name} photo={pet.photo} />
                  <span>
                    <strong>{pet.name}</strong>
                    <small>
                      {pet.registration} · {pet.species}
                    </small>
                  </span>
                </button>
              ))}
              {!matches.length && (
                <p className="empty-inline">
                  {pets.length
                    ? 'No se encontraron mascotas. Prueba otra búsqueda.'
                    : 'Registra una mascota desde Gestión de Mascotas para comenzar.'}
                </p>
              )}
            </div>
          </aside>
          <div className="min-w-0">
            {selected ? (
              <>
                <div className="clinical-pet-header">
                  <div className="flex flex-wrap items-center gap-4">
                    <PetAvatar
                      name={selected.name}
                      photo={selected.photo}
                      large
                    />
                    <div className="min-w-0">
                      <h2 className="text-2xl font-semibold break-words">
                        {selected.name}
                      </h2>
                      <p className="muted mt-1 text-sm break-words">
                        {selected.species} · {selected.breed} ·{' '}
                        {formatPetAge(selected)}
                      </p>
                      <p className="muted mt-2 text-xs break-words">
                        {selected.registration} · Tutor:{' '}
                        {owner
                          ? `${owner.firstName} ${owner.lastName}`
                          : 'No disponible'}
                      </p>
                    </div>
                  </div>
                  <div className="clinical-record-actions">
                    <button
                      className="button primary"
                      onClick={() => setForm('Consulta')}
                    >
                      <Icon name="medical" />
                      Registrar consulta
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => setForm('Vacuna')}
                    >
                      <Icon name="shield" />
                      Registrar vacuna
                    </button>
                  </div>
                  <div className="clinical-summary">
                    <div>
                      <strong>
                        {
                          history.filter((entry) => entry.kind === 'Consulta')
                            .length
                        }
                      </strong>
                      <span>Consultas</span>
                    </div>
                    <div>
                      <strong>
                        {
                          history.filter((entry) => entry.kind === 'Vacuna')
                            .length
                        }
                      </strong>
                      <span>Vacunas registradas</span>
                    </div>
                    <div>
                      <strong className="clinical-date">
                        {nextVisit
                          ? formatCalendarDate(nextVisit)
                          : 'Sin programar'}
                      </strong>
                      <span>Próximo control registrado</span>
                    </div>
                  </div>
                </div>
                <div className="clinical-history">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">
                      Historial de atenciones
                    </h2>
                    <select
                      className="form-select w-auto!"
                      aria-label="Filtrar atenciones"
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                    >
                      {['Todas', 'Consulta', 'Vacuna'].map((kind) => (
                        <option key={kind}>{kind}</option>
                      ))}
                    </select>
                  </div>
                  <p className="muted mt-2 text-xs">
                    De la atención más reciente a la más antigua.
                  </p>
                  {visible.length ? (
                    <ol className="clinical-timeline">
                      {visible.map((entry) => (
                        <li key={entry.id}>
                          <article className="clinical-entry">
                            <div className="clinical-entry-heading">
                              <span
                                className={`clinical-kind ${entry.kind === 'Vacuna' ? 'vaccine' : ''}`}
                              >
                                <Icon
                                  name={
                                    entry.kind === 'Consulta'
                                      ? 'medical'
                                      : 'shield'
                                  }
                                />
                                {entry.kind}
                              </span>
                              <time dateTime={entry.date}>
                                {formatCalendarDate(entry.date)}
                              </time>
                            </div>
                            <h3 className="mt-4 text-base font-semibold break-words">
                              {entry.kind === 'Consulta'
                                ? entry.reason
                                : entry.vaccine}
                            </h3>
                            <p className="muted mt-2 text-xs break-words">
                              Veterinario: {entry.veterinarian}
                            </p>
                            <dl className="clinical-entry-details">
                              {(entry.kind === 'Consulta'
                                ? [
                                    ['Diagnóstico', entry.diagnosis],
                                    [
                                      'Tratamiento',
                                      entry.treatment || 'No registrado',
                                    ],
                                  ]
                                : []
                              )
                                .concat(
                                  entry.notes
                                    ? [['Observaciones', entry.notes]]
                                    : [],
                                )
                                .concat(
                                  entry.nextVisit
                                    ? [
                                        [
                                          entry.kind === 'Consulta'
                                            ? 'Próximo control'
                                            : 'Próximo control o refuerzo',
                                          formatCalendarDate(entry.nextVisit),
                                        ],
                                      ]
                                    : [],
                                )
                                .map(([label, value]) => (
                                  <div key={label}>
                                    <dt>{label}</dt>
                                    <dd>{value}</dd>
                                  </div>
                                ))}
                            </dl>
                          </article>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="list-state">
                      <Icon name="medical" />
                      <h3>
                        {history.length
                          ? 'Sin atenciones de este tipo'
                          : 'Su historia empieza aquí'}
                      </h3>
                      <p>
                        {history.length
                          ? 'Cambia el filtro para consultar las demás atenciones.'
                          : 'Registra su primera consulta o vacuna.'}
                      </p>
                    </div>
                  )}
                  <p className="muted mt-5 text-xs">
                    {visible.length} de {history.length} atenciones · Guardado
                    en este navegador
                  </p>
                </div>
              </>
            ) : (
              <div className="list-state">
                <Icon name="paw" />
                <p>Selecciona una mascota para consultar su historia.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {form && selected && (
        <ClinicalForm
          pet={selected}
          kind={form}
          service={service}
          onSaved={saved}
          onClose={() => setForm(null)}
        />
      )}
    </section>
  )
}
