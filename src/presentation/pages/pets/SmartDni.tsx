import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { Pet } from '../../../domain/pets/Pet'
import type { Tutor } from '../../../domain/tutors/Tutor'
import { Modal } from '../../components/Modal'
import { PetAvatar } from './PetAvatar'
import { formatPetAge } from '../../utils/formatPetAge'
import logo from '../../assets/patitas-logo.jpg'

export function SmartDni({
  pet,
  tutor,
  onClose,
}: {
  pet: Pet
  tutor: Tutor
  onClose: () => void
}) {
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')
  const content = `Patitas de Amor | DEMO\nRegistro: ${pet.registration}\nMascota: ${pet.name}\nEspecie: ${pet.species}\nTutor: ${tutor.firstName} ${tutor.lastName}\nContacto: ${tutor.phone}`
  useEffect(() => {
    let active = true
    QRCode.toDataURL(content, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
      .then((value) => {
        if (active) setQr(value)
      })
      .catch(() => {
        if (active) setError('No se pudo generar el QR. Vuelve a abrir el DNI.')
      })
    return () => {
      active = false
    }
  }, [content])
  return (
    <Modal title="DNI Smart" eyebrow="IDENTIFICACIÓN DIGITAL" onClose={onClose}>
      <div className="modal-body">
        <article className="smart-dni" aria-label={`DNI Smart de ${pet.name}`}>
          <div className="dni-brand">
            <img src={logo} alt="Patitas de Amor" />
            <div>
              <strong>Patitas de Amor</strong>
              <span>Identificación de mascota</span>
            </div>
            <span className="pet-status approved">Aprobado</span>
          </div>
          <div className="dni-main">
            <PetAvatar name={pet.name} photo={pet.photo} large />
            <div className="min-w-0">
              <p className="muted text-xs">NÚMERO DE REGISTRO</p>
              <strong className="dni-number">{pet.registration}</strong>
              <h3 className="mt-2 text-2xl font-semibold break-words">
                {pet.name}
              </h3>
              <p className="muted text-sm break-words">
                {pet.species} · {pet.breed}
              </p>
            </div>
          </div>
          <dl className="detail-grid">
            {[
              ['Sexo', pet.sex],
              ['Edad', formatPetAge(pet)],
              ['Color', pet.color],
              ['Microchip', pet.microchip || 'No informado'],
              ['Tutor', `${tutor.firstName} ${tutor.lastName}`],
              ['DNI del tutor', tutor.dni],
              ['Contacto', tutor.phone],
              ['Distrito', tutor.district],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="dni-qr">
            {qr ? (
              <img
                src={qr}
                alt={`Código QR de identificación de ${pet.name}`}
                width="160"
                height="160"
              />
            ) : (
              <p role={error ? 'alert' : 'status'}>
                {error || 'Generando QR…'}
              </p>
            )}
            <p>
              Escanea para consultar el número de registro y el contacto de su
              tutor.
            </p>
          </div>
          <p className="muted text-center text-xs">
            Documento de demostración · Sin validez oficial
          </p>
        </article>
      </div>
      <div className="modal-actions">
        <button className="button primary" onClick={onClose}>
          Volver a la ficha
        </button>
      </div>
    </Modal>
  )
}
