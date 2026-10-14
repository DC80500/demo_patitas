import logo from '../assets/patitas-logo.jpg'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <img src={logo} alt="Logo de Patitas de Amor" width="64" height="64" />
      <div>
        <strong>Patitas de Amor</strong>
        <span>Bienestar que nos une</span>
      </div>
    </div>
  )
}
