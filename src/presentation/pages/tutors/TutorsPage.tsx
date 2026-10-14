import { useEffect, useRef, useState } from 'react'
import type { Tutor } from '../../../domain/tutors/Tutor'
import type { TutorService } from '../../../application/tutors/TutorService'
import { Icon } from '../../components/Icon'
import { TutorForm } from './TutorForm'
import { TutorDetail } from './TutorDetail'

const searchable = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export function TutorsPage({ service }: { service: TutorService }) {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [editor, setEditor] = useState<{ tutor?: Tutor } | null>(null)
  const [detail, setDetail] = useState<Tutor | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    let cancelled = false
    service
      .list()
      .then((data) => {
        if (!cancelled) setTutors(data)
      })
      .catch((cause) => {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : 'No se pudo cargar el listado.',
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [service])
  async function retry() {
    setLoading(true)
    setError('')
    try {
      setTutors(await service.list())
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo cargar el listado.',
      )
    } finally {
      setLoading(false)
    }
  }
  function saved(tutor: Tutor) {
    const editing = Boolean(editor?.tutor)
    setTutors((current) =>
      current.some((item) => item.id === tutor.id)
        ? current.map((item) => (item.id === tutor.id ? tutor : item))
        : [...current, tutor],
    )
    setEditor(null)
    setQuery('')
    setNotice(
      editing
        ? 'Los datos del tutor se actualizaron correctamente.'
        : 'El tutor se registró correctamente.',
    )
  }
  const matches = tutors.filter((tutor) =>
    searchable(
      `${tutor.firstName} ${tutor.lastName} ${tutor.dni} ${tutor.phone}`,
    ).includes(searchable(query)),
  )
  const petCount = tutors.reduce((sum, tutor) => sum + tutor.pets.length, 0)
  return (
    <div className="tutors-page">
      <div className="tutors-heading">
        <div className="page-heading">
          <span className="eyebrow">FAMILIAS QUE CUIDAN</span>
          <h1 ref={heading} tabIndex={-1}>
            Gestión de Tutores
          </h1>
          <p className="muted">Personas y familias detrás de cada historia.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setNotice('')
            setEditor({})
          }}
          disabled={loading || Boolean(error)}
        >
          <Icon name="users" />
          Registrar tutor
        </button>
      </div>
      <div className="tutor-metrics">
        <div>
          <span className="metric-icon">
            <Icon name="users" />
          </span>
          <div>
            <strong>{loading ? '—' : tutors.length}</strong>
            <span>Tutores registrados</span>
          </div>
        </div>
        <div>
          <span className="metric-icon">
            <Icon name="paw" />
          </span>
          <div>
            <strong>{loading ? '—' : petCount}</strong>
            <span>Mascotas asociadas</span>
          </div>
        </div>
        <span className="demo-label">Datos de demostración</span>
      </div>
      {notice && (
        <div className="success-notice" role="status">
          <Icon name="check" />
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Cerrar mensaje"
            onClick={() => setNotice('')}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      <section className="tutor-list" aria-labelledby="tutors-list-title">
        <div className="tutor-toolbar">
          <div>
            <h2 id="tutors-list-title">Nuestros tutores</h2>
            <p className="muted text-sm">
              Consulta y mantén actualizada su información.
            </p>
          </div>
          <div className="search-field">
            <Icon name="search" />
            <input
              type="search"
              aria-label="Buscar tutores"
              placeholder="Nombre, DNI o celular"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <span className="search-hint" aria-hidden="true">
              Buscar
            </span>
          </div>
        </div>
        {loading ? (
          <p className="list-state" role="status">
            Cargando tutores…
          </p>
        ) : error ? (
          <div className="list-state" role="alert">
            <p>{error}</p>
            <button className="button secondary mt-4" onClick={retry}>
              Reintentar
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="list-state">
            <Icon name="users" />
            <h3>
              {query
                ? 'No encontramos coincidencias'
                : 'Aún no hay tutores registrados'}
            </h3>
            <p>
              {query
                ? 'Prueba con otro nombre, DNI o celular.'
                : 'Registra al primer tutor para comenzar.'}
            </p>
            {query && (
              <button
                className="button secondary mt-4"
                onClick={() => setQuery('')}
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="tutor-table">
            <div className="tutor-table-header" aria-hidden="true">
              <span>Tutor</span>
              <span>Contacto</span>
              <span>Distrito</span>
              <span>Mascotas</span>
              <span>Acciones</span>
            </div>
            {matches.map((tutor) => (
              <article
                className="tutor-row"
                key={tutor.id}
                aria-label={`Tutor ${tutor.firstName} ${tutor.lastName}`}
              >
                <div className="tutor-identity">
                  <span className="tutor-avatar">
                    {tutor.firstName[0]}
                    {tutor.lastName[0]}
                  </span>
                  <div>
                    <h3>
                      {tutor.firstName} {tutor.lastName}
                    </h3>
                    <p>DNI {tutor.dni}</p>
                  </div>
                </div>
                <div className="tutor-contact">
                  <span>{tutor.phone}</span>
                  <span>{tutor.email}</span>
                </div>
                <span className="tutor-district">{tutor.district}</span>
                <span className="pets-count">
                  <Icon name="paw" />
                  {tutor.pets.length}
                  <span className="min-[1201px]:sr-only">mascotas</span>
                </span>
                <div className="tutor-actions">
                  <button
                    type="button"
                    className="row-button"
                    onClick={() => setDetail(tutor)}
                    aria-label={`Ver ficha de ${tutor.firstName} ${tutor.lastName}`}
                  >
                    <Icon name="eye" />
                    <span>Ver ficha</span>
                  </button>
                  <button
                    type="button"
                    className="row-button"
                    onClick={() => {
                      setNotice('')
                      setEditor({ tutor })
                    }}
                    aria-label={`Editar a ${tutor.firstName} ${tutor.lastName}`}
                  >
                    <Icon name="edit" />
                    <span>Editar</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && !error && (
          <div className="list-footer" role="status">
            {matches.length} de {tutors.length} tutores · Guardado en este
            navegador
          </div>
        )}
      </section>
      {editor && (
        <TutorForm
          service={service}
          tutor={editor.tutor}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      {detail && (
        <TutorDetail
          tutor={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditor({ tutor: detail })
            setDetail(null)
          }}
        />
      )}
    </div>
  )
}
