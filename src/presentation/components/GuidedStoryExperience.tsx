import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  advanceStory,
  newGuidedStory,
  reconcileStory,
  storySteps,
  type GuidedStory,
} from '../../domain/guidedStory/GuidedStory'
import type { GuidedStoryRepository } from '../../application/guidedStory/GuidedStoryRepository'
import type { TutorService } from '../../application/tutors/TutorService'
import type { PetService } from '../../application/pets/PetService'
import type { ClinicalService } from '../../application/clinical/ClinicalService'
import type { Tutor } from '../../domain/tutors/Tutor'
import type { Pet } from '../../domain/pets/Pet'
import type { ClinicalEntry } from '../../domain/clinical/ClinicalEntry'
import { TutorForm } from '../pages/tutors/TutorForm'
import { TutorDetail } from '../pages/tutors/TutorDetail'
import { PetForm } from '../pages/pets/PetForm'
import { PetDetail } from '../pages/pets/PetDetail'
import { SmartDni } from '../pages/pets/SmartDni'
import { ClinicalForm } from '../pages/clinical/ClinicalForm'
import { Icon } from './Icon'
import type { PanelPage } from './AppShell'

const steps = [
  {
    label: 'Tutor',
    title: 'Conozcamos a su familia',
    description:
      'Registra a la persona responsable. Usaremos este tutor en el siguiente paso.',
    action: 'Registrar tutor',
    page: 'tutors',
  },
  {
    label: 'Mascota',
    title: 'Démosle su propia ficha',
    description:
      'Registra a su mascota. El tutor que acabas de crear ya estará seleccionado.',
    action: 'Registrar su mascota',
    page: 'pets',
  },
  {
    label: 'Aprobación',
    title: 'Revisa y aprueba su registro',
    description:
      'Comprueba los datos de la ficha y aprueba el registro para habilitar su identificación.',
    action: 'Revisar y aprobar',
    page: 'pets',
  },
  {
    label: 'DNI',
    title: 'Conoce su identificación digital',
    description:
      'Abre el DNI Smart y su código QR. Después, continúa a su primera atención veterinaria.',
    action: 'Consultar DNI Smart',
    page: 'pets',
  },
  {
    label: 'Atención',
    title: 'Escribamos su primera atención',
    description:
      'Registra una consulta o vacuna para completar su historia. Puedes añadir el próximo control.',
    action: 'Registrar primera consulta',
    page: 'clinical',
  },
] as const
type StoryModal =
  | 'tutorForm'
  | 'editTutor'
  | 'petForm'
  | 'editPet'
  | 'petDetail'
  | 'dni'
  | 'consultation'
  | 'vaccine'
  | 'tutorDetail'
  | null

export function GuidedStoryExperience({
  repository,
  tutors,
  pets,
  clinical,
  page,
  onNavigate,
  onViewHistory,
  children,
}: {
  repository: GuidedStoryRepository
  tutors: TutorService
  pets: PetService
  clinical: ClinicalService
  page: PanelPage
  onNavigate: (page: PanelPage) => void
  onViewHistory: (petId: string) => void
  children: (revision: number) => ReactNode
}) {
  const [story, setStory] = useState<GuidedStory | null>(null),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [storageError, setStorageError] = useState('')
  const [tutor, setTutor] = useState<Tutor>(),
    [pet, setPet] = useState<Pet>(),
    [modal, setModal] = useState<StoryModal>(null),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(''),
    [dniReady, setDniReady] = useState(false)
  const title = useRef<HTMLHeadingElement>(null)
  const readRelated = useCallback(
    async (state: GuidedStory) => {
      const [owners, animals, entries] = await Promise.all([
        tutors.list(),
        pets.list(),
        clinical.list(),
      ])
      const reconciled = reconcileStory(state, owners, animals, entries)
      return {
        state: reconciled,
        tutor: owners.find((item) => item.id === reconciled.tutorId),
        pet: animals.find((item) => item.id === reconciled.petId),
      }
    },
    [tutors, pets, clinical],
  )
  useEffect(() => {
    let active = true
    repository
      .load()
      .then(async (saved) => {
        if (!saved) return
        const related = await readRelated(saved)
        if (active) {
          setStory({ ...related.state, paused: true })
          setTutor(related.tutor)
          setPet(related.pet)
        }
      })
      .catch((cause) => {
        if (active)
          setLoadError(
            cause instanceof Error
              ? cause.message
              : 'No se pudo recuperar el recorrido.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [repository, readRelated])
  useEffect(() => {
    if (story && !story.paused && !modal) {
      window.scrollTo(0, 0)
      title.current?.focus({ preventScroll: true })
    }
  }, [story, modal])
  const onDniReady = useCallback(() => setDniReady(true), [])
  function commit(next: GuidedStory) {
    setStory(next)
    setStorageError('')
    void repository
      .save(next)
      .catch((cause) =>
        setStorageError(
          cause instanceof Error
            ? cause.message
            : 'No se pudo guardar el progreso.',
        ),
      )
  }
  function begin() {
    setLoadError('')
    setTutor(undefined)
    setPet(undefined)
    setDniReady(false)
    setActionError('')
    commit(newGuidedStory())
    onNavigate('tutors')
    setModal('tutorForm')
  }
  async function resume() {
    if (!story || loading) return
    setLoading(true)
    setLoadError('')
    try {
      const related = await readRelated({ ...story, paused: false })
      setTutor(related.tutor)
      setPet(related.pet)
      commit(related.state)
      setRevision((current) => current + 1)
      if (related.state.step === 'clinical' && related.pet)
        onViewHistory(related.pet.id)
      else
        onNavigate(
          related.state.step === 'complete'
            ? 'welcome'
            : steps[storySteps.indexOf(related.state.step)].page,
        )
    } catch (cause) {
      setLoadError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo retomar el recorrido.',
      )
    } finally {
      setLoading(false)
    }
  }
  function pause() {
    if (!story) return
    setModal(null)
    commit({ ...story, paused: true })
    onNavigate('welcome')
  }
  function openStep() {
    if (!story) return
    setActionError('')
    const index = storySteps.indexOf(story.step)
    if (index === 5) return
    onNavigate(steps[index].page)
    if (story.step === 'tutor') setModal('tutorForm')
    if (story.step === 'pet') setModal('petForm')
    if (story.step === 'approval') setModal('petDetail')
    if (story.step === 'dni') {
      setDniReady(false)
      setModal('dni')
    }
    if (story.step === 'clinical') setModal('consultation')
  }
  function tutorSaved(created: Tutor) {
    if (!story) return
    setTutor(created)
    setModal(null)
    commit(advanceStory(story, { type: 'tutor-created', tutor: created }))
    setRevision((current) => current + 1)
    onNavigate('pets')
  }
  function petSaved(created: Pet) {
    if (!story) return
    setPet(created)
    setTutor((current) =>
      current
        ? {
            ...current,
            pets: [
              ...current.pets.filter((item) => item.id !== created.id),
              { id: created.id, name: created.name, species: created.species },
            ],
          }
        : current,
    )
    setModal(null)
    commit(
      modal === 'editPet'
        ? {
            step: 'approval',
            paused: false,
            tutorId: story.tutorId,
            petId: created.id,
          }
        : advanceStory(story, { type: 'pet-created', pet: created }),
    )
    setRevision((current) => current + 1)
    onNavigate('pets')
  }
  async function approve() {
    if (!story || !pet || busy) return
    setBusy(true)
    setActionError('')
    try {
      const approved = await pets.approve(pet.id)
      setPet(approved)
      commit(advanceStory(story, { type: 'pet-approved', pet: approved }))
      setModal(null)
      setRevision((current) => current + 1)
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
  function closeDni() {
    setModal(null)
    if (story?.step === 'dni' && pet && dniReady) {
      commit(advanceStory(story, { type: 'dni-viewed', petId: pet.id }))
      onViewHistory(pet.id)
    }
  }
  function attentionSaved(entry: ClinicalEntry) {
    if (!story || !pet) return
    setModal(null)
    commit(advanceStory(story, { type: 'attention-created', entry }))
    setRevision((current) => current + 1)
    onViewHistory(pet.id)
  }
  const active = story && !story.paused
  const index = story ? storySteps.indexOf(story.step) : 0
  const current = steps[Math.min(index, 4)]
  return (
    <>
      {active && (
        <section className="story-guide" aria-labelledby="story-title">
          <div className="story-guide-heading">
            <span className="story-badge">
              <Icon name={index === 5 ? 'check' : 'paw'} />
              {index === 5 ? 'Historia completada' : `Paso ${index + 1} de 5`}
            </span>
            <button type="button" className="story-exit" onClick={pause}>
              {index === 5
                ? 'Finalizar recorrido'
                : 'Salir y continuar después'}
            </button>
          </div>
          <h2 id="story-title" ref={title} tabIndex={-1}>
            {index === 5
              ? '¡Su historia ya forma parte de Patitas!'
              : current.title}
          </h2>
          <p className="muted">
            {index === 5
              ? `${tutor?.firstName ?? 'Su tutor'} y ${pet?.name ?? 'su mascota'} ya tienen sus fichas vinculadas, identificación y primera atención veterinaria.`
              : current.description}
          </p>
          <progress
            aria-label="Pasos completados del recorrido"
            max={5}
            value={index}
          />
          <ol className="story-progress" aria-label="Pasos del recorrido">
            {steps.map((step, position) => (
              <li
                key={step.label}
                aria-current={position === index ? 'step' : undefined}
                className={
                  position < index
                    ? 'done'
                    : position === index
                      ? 'current'
                      : ''
                }
              >
                <span>
                  {position < index ? <Icon name="check" /> : position + 1}
                </span>
                {step.label}
              </li>
            ))}
          </ol>
          {(tutor || pet) && index < 5 && (
            <p className="story-context">
              {tutor ? `Tutor: ${tutor.firstName} ${tutor.lastName}` : ''}
              {pet ? ` · Mascota: ${pet.name} (${pet.registration})` : ''}
            </p>
          )}
          <div className="story-actions">
            {index < 5 ? (
              <>
                <button
                  type="button"
                  className="button primary"
                  onClick={openStep}
                  disabled={loading}
                >
                  {current.action}
                  <Icon name="arrow" />
                </button>
                {story.step === 'clinical' && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setModal('vaccine')}
                  >
                    Registrar primera vacuna
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setModal('tutorDetail')}
                  disabled={!tutor}
                >
                  Ver ficha del tutor
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setActionError('')
                    setModal('petDetail')
                  }}
                  disabled={!pet}
                >
                  Ver ficha de la mascota
                </button>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    if (pet) {
                      commit({ ...story, paused: true })
                      onViewHistory(pet.id)
                      window.scrollTo(0, 0)
                    }
                  }}
                  disabled={!pet}
                >
                  Ver historial clínico
                  <Icon name="arrow" />
                </button>
              </>
            )}
          </div>
        </section>
      )}
      {(loadError || storageError) && (
        <div className="story-warning" role="alert">
          <p>{loadError || storageError}</p>
          {storageError && story && (
            <button className="button secondary" onClick={() => commit(story)}>
              Reintentar guardar progreso
            </button>
          )}
        </div>
      )}
      {children(revision)}
      {page === 'welcome' && !active && (
        <section
          className="story-invitation"
          aria-labelledby="story-invitation-title"
        >
          <span className="story-invitation-icon">
            <Icon name="paw" />
          </span>
          <div>
            <p className="eyebrow">UN RECORRIDO CONTIGO</p>
            <h2 id="story-invitation-title">Crea tu primera historia</h2>
            <p className="muted">
              Registra un tutor y su mascota, genera su identificación y añade
              su primera atención veterinaria.
            </p>
            <p className="story-invitation-hint">
              Cinco pasos guiados. Tus registros quedarán guardados para seguir
              explorando.
            </p>
            {story && (
              <p className="story-resume-copy">
                {story.step === 'complete'
                  ? 'Ya completaste una historia. Puedes revisar el resultado o comenzar otra.'
                  : `Tienes un recorrido pendiente: paso ${index + 1} de 5 · ${current.label}.`}
              </p>
            )}
            <div className="story-actions">
              <button
                className="button primary"
                onClick={story ? () => void resume() : begin}
                disabled={loading}
              >
                {loading
                  ? 'Cargando recorrido…'
                  : story
                    ? story.step === 'complete'
                      ? 'Ver mi historia'
                      : 'Retomar recorrido'
                    : 'Iniciar recorrido guiado'}
                <Icon name="arrow" />
              </button>
              {story?.step === 'complete' && (
                <button
                  className="button secondary"
                  onClick={begin}
                  disabled={loading}
                >
                  Crear otra historia
                </button>
              )}
            </div>
          </div>
        </section>
      )}
      {(modal === 'tutorForm' || modal === 'editTutor') && (
        <TutorForm
          service={tutors}
          tutor={modal === 'editTutor' ? tutor : undefined}
          onSaved={
            modal === 'editTutor'
              ? (updated) => {
                  setTutor(updated)
                  setModal('tutorDetail')
                  setRevision((current) => current + 1)
                }
              : tutorSaved
          }
          onClose={() => setModal(null)}
        />
      )}
      {(modal === 'petForm' || modal === 'editPet') && tutor && (
        <PetForm
          pet={modal === 'editPet' ? pet : undefined}
          tutors={[tutor]}
          initialTutorId={tutor.id}
          service={pets}
          onSaved={petSaved}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'petDetail' && pet && (
        <PetDetail
          pet={pet}
          tutor={tutor}
          busy={busy}
          error={actionError}
          onApprove={() => void approve()}
          onDni={() => {
            setDniReady(false)
            setModal('dni')
          }}
          onEdit={() => setModal('editPet')}
          onClose={() => {
            if (!busy) setModal(null)
          }}
        />
      )}
      {modal === 'dni' && pet && tutor && (
        <SmartDni
          pet={pet}
          tutor={tutor}
          onReady={onDniReady}
          closeLabel={
            story?.step === 'dni'
              ? 'Continuar a Historia Clínica'
              : 'Cerrar identificación'
          }
          onClose={closeDni}
        />
      )}
      {(modal === 'consultation' || modal === 'vaccine') && pet && (
        <ClinicalForm
          pet={pet}
          kind={modal === 'consultation' ? 'Consulta' : 'Vacuna'}
          service={clinical}
          onSaved={attentionSaved}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'tutorDetail' && tutor && (
        <TutorDetail
          tutor={tutor}
          onEdit={() => setModal('editTutor')}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
