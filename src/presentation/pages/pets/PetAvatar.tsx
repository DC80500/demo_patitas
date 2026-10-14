import { Icon } from '../../components/Icon'
export function PetAvatar({
  name,
  photo,
  large = false,
}: {
  name: string
  photo: string
  large?: boolean
}) {
  return (
    <span className={`pet-avatar ${large ? 'pet-avatar-large' : ''}`}>
      {photo ? (
        <img src={photo} alt={`Fotografía de ${name}`} />
      ) : (
        <Icon name="paw" />
      )}
    </span>
  )
}
