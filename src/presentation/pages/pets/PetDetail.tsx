import type { Pet } from '../../../domain/pets/Pet'
import type { Tutor } from '../../../domain/tutors/Tutor'
import { Modal } from '../../components/Modal'
import { PetAvatar } from './PetAvatar'
import { formatPetAge } from '../../utils/formatPetAge'

export function PetDetail({
  pet,
  tutor,
  busy,
  error,
  onApprove,
  onDni,
  onEdit,
  onClose,
}: {
  pet: Pet
  tutor?: Tutor
  busy: boolean
  error: string
  onApprove: () => void
  onDni: () => void
  onEdit: () => void
  onClose: () => void
}) {
  return (
    <Modal
      title="Ficha de la mascota"
      eyebrow="GESTIÓN DE MASCOTAS"
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <div className="modal-body">
        <div className="flex flex-wrap items-center gap-4">
          <PetAvatar name={pet.name} photo={pet.photo} large />
          <div className="min-w-0">
            <h3 className="text-2xl font-semibold break-words">{pet.name}</h3>
            <p className="muted mt-1 text-sm">{pet.registration}</p>
            <span
              className={`pet-status ${pet.status === 'Aprobado' ? 'approved' : ''}`}
            >
              {pet.status}
            </span>
          </div>
        </div>
        {error && (
          <p className="form-error mt-5" role="alert">
            {error}
          </p>
        )}
        <dl className="detail-grid">
          {[
            ['Especie', pet.species],
            ['Raza', pet.breed],
            ['Sexo', pet.sex],
            ['Edad', formatPetAge(pet)],
            ['Color', pet.color],
            ['Microchip', pet.microchip || 'No informado'],
            ['Esterilización', pet.sterilized],
            ['Vacunas', pet.vaccines || 'No informadas'],
            ['Observaciones', pet.notes || 'Sin observaciones'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <h3 className="form-section-title mt-7">Tutor responsable</h3>
        <dl className="detail-grid mt-3">
          {[
            [
              'Nombre',
              tutor
                ? `${tutor.firstName} ${tutor.lastName}`
                : 'Tutor no disponible',
            ],
            ['DNI', tutor?.dni ?? '—'],
            ['Celular', tutor?.phone ?? '—'],
            ['Dirección', tutor ? `${tutor.address}, ${tutor.district}` : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <h3 className="form-section-title mt-7">Veterinario habitual</h3>
        <dl className="detail-grid mt-3">
          {[
            ['Nombre', pet.vetName || 'No informado'],
            ['Celular', pet.vetPhone || 'No informado'],
            ['Dirección', pet.vetAddress || 'No informada'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {pet.status === 'Pendiente' && (
          <p className="review-note mt-6">
            Revisa la ficha y aprueba el registro para habilitar su DNI Smart.
          </p>
        )}
      </div>
      <div className="modal-actions">
        <button className="button secondary" onClick={onEdit} disabled={busy}>
          Editar mascota
        </button>
        <button
          className="button primary"
          disabled={busy || !tutor}
          onClick={pet.status === 'Aprobado' ? onDni : onApprove}
        >
          {busy
            ? 'Aprobando…'
            : pet.status === 'Aprobado'
              ? 'Ver DNI Smart'
              : 'Aprobar registro'}
        </button>
      </div>
    </Modal>
  )
}
