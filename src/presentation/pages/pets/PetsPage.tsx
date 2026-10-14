import { useEffect, useRef, useState } from 'react'
import type { Pet } from '../../../domain/pets/Pet'
import type { Tutor } from '../../../domain/tutors/Tutor'
import type { PetService } from '../../../application/pets/PetService'
import type { TutorService } from '../../../application/tutors/TutorService'
import { Icon } from '../../components/Icon'
import { PetAvatar } from './PetAvatar'
import { PetForm } from './PetForm'
import { PetDetail } from './PetDetail'
import { SmartDni } from './SmartDni'
import { formatPetAge } from '../../utils/formatPetAge'

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
export function PetsPage({
  service,
  tutorService,
}: {
  service: PetService
  tutorService: TutorService
}) {
  const [pets, setPets] = useState<Pet[]>([]),
    [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0)
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('Todos'),
    [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<Pet>(),
    [mode, setMode] = useState<'form' | 'detail' | 'dni' | null>(null),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    let active = true
    Promise.all([service.list(), tutorService.list()])
      .then(([records, owners]) => {
        if (active) {
          setPets(records)
          setTutors(owners)
          setError('')
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'No se pudo cargar el listado.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [service, tutorService, retry])
  const tutorFor = (pet: Pet) =>
    tutors.find((tutor) => tutor.id === pet.tutorId)
  const filtered = pets.filter((pet) => {
    const tutor = tutorFor(pet)
    return (
      (status === 'Todos' || pet.status === status) &&
      normalize(
        `${pet.name} ${pet.registration} ${tutor?.dni ?? ''} ${tutor?.firstName ?? ''} ${tutor?.lastName ?? ''}`,
      ).includes(normalize(query.trim()))
    )
  })
  function open(pet: Pet | undefined, next: 'form' | 'detail') {
    setSelected(pet)
    setActionError('')
    setMode(next)
  }
  function saved(pet: Pet) {
    setPets((current) =>
      current.some((item) => item.id === pet.id)
        ? current.map((item) => (item.id === pet.id ? pet : item))
        : [...current, pet],
    )
    setMode(null)
    setNotice(`Registro de ${pet.name} guardado. Pendiente de aprobación.`)
  }
  async function approve() {
    if (!selected || busy) return
    setBusy(true)
    setActionError('')
    try {
      const pet = await service.approve(selected.id)
      setSelected(pet)
      setPets((current) =>
        current.map((item) => (item.id === pet.id ? pet : item)),
      )
      setNotice(`${pet.name}: registro aprobado. DNI Smart disponible.`)
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo aprobar el registro.',
      )
    } finally {
      setBusy(false)
    }
  }
  const owner = selected ? tutorFor(selected) : undefined
  return (
    <section aria-labelledby="pets-title">
      <div className="tutors-heading">
        <div>
          <p className="eyebrow">CADA VIDA CUENTA</p>
          <h1
            id="pets-title"
            ref={heading}
            tabIndex={-1}
            className="mt-2 text-[clamp(1.8rem,3vw,2.5rem)] font-bold tracking-tight"
          >
            Gestión de Mascotas
          </h1>
          <p className="muted mt-2 text-sm">
            Su identidad, su familia y su bienestar en un solo lugar.
          </p>
        </div>
        <button
          className="button primary"
          disabled={loading || Boolean(error) || !tutors.length}
          onClick={() => open(undefined, 'form')}
        >
          <Icon name="paw" />
          Registrar mascota
        </button>
      </div>
      <div className="tutor-metrics">
        {[
          [pets.length, 'Mascotas registradas', 'paw'],
          [
            pets.filter((pet) => pet.status === 'Aprobado').length,
            'Registros aprobados',
            'check',
          ],
          [
            pets.filter((pet) => pet.status === 'Pendiente').length,
            'Pendientes de revisión',
            'shield',
          ],
        ].map(([count, label, icon]) => (
          <div key={label}>
            <span className="metric-icon">
              <Icon name={icon as 'paw' | 'check' | 'shield'} />
            </span>
            <div>
              <strong>{count}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
      {notice && (
        <div className="success-notice" role="status">
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
      <div className="tutor-list">
        <div className="tutor-toolbar">
          <div>
            <h2>Mascotas de nuestra comunidad</h2>
            <p className="muted text-xs">
              Busca por nombre, número de registro o DNI del tutor.
            </p>
          </div>
          <div className="pet-filters">
            <label className="search-field">
              <Icon name="search" />
              <input
                aria-label="Buscar mascotas"
                placeholder="Nombre, registro o DNI"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select
              className="form-select"
              aria-label="Filtrar por estado"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {['Todos', 'Pendiente', 'Aprobado'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="list-state" role="status">
            Cargando mascotas…
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
        ) : filtered.length ? (
          <div className="pet-records">
            {filtered.map((pet) => {
              const tutor = tutorFor(pet)
              return (
                <article className="pet-record-card" key={pet.id}>
                  <div className="flex items-start gap-3">
                    <PetAvatar name={pet.name} photo={pet.photo} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold break-words">
                        {pet.name}
                      </h3>
                      <p className="muted mt-1 text-xs">{pet.registration}</p>
                    </div>
                    <span
                      className={`pet-status ${pet.status === 'Aprobado' ? 'approved' : ''}`}
                    >
                      {pet.status}
                    </span>
                  </div>
                  <p className="muted mt-4 text-sm break-words">
                    {pet.species} · {pet.breed} · {formatPetAge(pet)}
                  </p>
                  <div className="pet-owner">
                    <Icon name="heart" />
                    <div>
                      <strong>
                        {tutor
                          ? `${tutor.firstName} ${tutor.lastName}`
                          : 'Tutor no disponible'}
                      </strong>
                      <span>DNI {tutor?.dni ?? '—'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="row-button"
                      onClick={() => open(pet, 'detail')}
                      aria-label={`Ver ficha de ${pet.name}`}
                    >
                      <Icon name="eye" />
                      Ver ficha
                    </button>
                    <button
                      className="row-button"
                      onClick={() => open(pet, 'form')}
                      aria-label={`Editar ${pet.name}`}
                    >
                      <Icon name="edit" />
                      Editar
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="list-state">
            <Icon name="paw" />
            <h3>No se encontraron mascotas</h3>
            <p>
              {query || status !== 'Todos'
                ? 'Prueba otra búsqueda o cambia el filtro.'
                : 'Registra la primera mascota de la comunidad.'}
            </p>
          </div>
        )}
        <p className="list-footer">
          {filtered.length} de {pets.length} mascotas · Registros guardados en
          este navegador
        </p>
      </div>
      {mode === 'form' && (
        <PetForm
          pet={selected}
          tutors={tutors}
          service={service}
          onSaved={saved}
          onClose={() => setMode(null)}
        />
      )}
      {mode === 'detail' && selected && (
        <PetDetail
          pet={selected}
          tutor={owner}
          busy={busy}
          error={actionError}
          onApprove={() => void approve()}
          onDni={() => setMode('dni')}
          onEdit={() => setMode('form')}
          onClose={() => setMode(null)}
        />
      )}
      {mode === 'dni' && selected?.status === 'Aprobado' && owner && (
        <SmartDni
          pet={selected}
          tutor={owner}
          onClose={() => setMode('detail')}
        />
      )}
    </section>
  )
}
