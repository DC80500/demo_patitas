import { Icon } from '../../components/Icon'
import { useState } from 'react'
export function PetAvatar({
  name,
  photo,
  large = false,
}: {
  name: string
  photo: string
  large?: boolean
}) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null)
  return (
    <span className={`pet-avatar ${large ? 'pet-avatar-large' : ''}`}>
      {photo && failedPhoto !== photo ? (
        <img
          src={photo}
          alt={`Fotografía de ${name}`}
          decoding="async"
          width={96}
          height={96}
          onError={() => setFailedPhoto(photo)}
        />
      ) : (
        <Icon name="paw" />
      )}
    </span>
  )
}
