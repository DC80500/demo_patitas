import type { Tutor } from '../../../domain/tutors/Tutor'
import { Modal } from '../../components/Modal'
import { Icon } from '../../components/Icon'

export function TutorDetail({
  tutor,
  onEdit,
  onClose,
}: {
  tutor: Tutor
  onEdit: () => void
  onClose: () => void
}) {
  return (
    <Modal title="Ficha del tutor" onClose={onClose}>
      <div className="modal-body">
        <div className="flex items-center gap-4">
          <span className="tutor-avatar">
            {tutor.firstName[0]}
            {tutor.lastName[0]}
          </span>
          <div>
            <h3 className="text-xl font-semibold text-ink">
              {tutor.firstName} {tutor.lastName}
            </h3>
            <p className="muted text-sm">DNI {tutor.dni}</p>
          </div>
        </div>
        <dl className="detail-grid">
          {[
            ['Celular', tutor.phone],
            ['Correo electrónico', tutor.email],
            ['Distrito', tutor.district],
            ['Dirección', tutor.address],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-7 border-t border-line pt-6">
          <h3 className="text-base font-semibold">
            Mascotas asociadas{' '}
            <span className="count-badge">{tutor.pets.length}</span>
          </h3>
          <p className="muted mt-2 text-sm">
            Mascotas vinculadas a este tutor desde Gestión de Mascotas.
          </p>
          {tutor.pets.length ? (
            <div className="mt-4 grid gap-3 min-[501px]:grid-cols-2">
              {tutor.pets.map((pet) => (
                <div className="pet-summary" key={pet.id}>
                  <span className="pet-summary-icon">
                    <Icon name="paw" />
                  </span>
                  <div>
                    <strong>{pet.name}</strong>
                    <span>{pet.species}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-inline">
              Este tutor todavía no tiene mascotas asociadas.
            </p>
          )}
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          Cerrar
        </button>
        <button type="button" className="button primary" onClick={onEdit}>
          Editar tutor
          <Icon name="arrow" />
        </button>
      </div>
    </Modal>
  )
}
