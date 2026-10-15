import { useEffect, useRef } from 'react'
import type { User } from '../../domain/auth/User'
import { Icon } from '../components/Icon'

export function WelcomePage({ user }: { user: User }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">TU ESPACIO PARA HACER EL BIEN</span>
        <h1 ref={heading} tabIndex={-1}>
          Hola, {user.name}{' '}
          <span className="greeting-paw ml-[.3rem] inline-flex align-middle text-primary">
            <Icon name="paw" />
          </span>
        </h1>
        <p className="muted">
          Qué bueno tenerte aquí. Juntos, cuidamos cada historia.
        </p>
      </div>
      <section className="welcome-banner" aria-labelledby="banner-title">
        <div className="banner-copy z-[1] flex flex-col justify-center p-6 min-[701px]:p-[1.8rem] min-[1201px]:p-[2.2rem]">
          <span className="banner-label flex items-center gap-2 text-xs font-[650] text-primary">
            <Icon name="heart" /> Patitas de Amor
          </span>
          <h2 id="banner-title">
            Más cuidado.
            <br />
            Más historias felices.
          </h2>
          <p>
            Un solo lugar para conectar a las mascotas, sus familias y quienes
            velan por su bienestar.
          </p>
          <span className="banner-footnote">
            <span className="inline-block size-[.4rem] shrink-0 rounded-full bg-current" />{' '}
            Acompañamos cada etapa de su vida
          </span>
        </div>
        <div
          className="banner-art relative hidden min-h-60 place-items-center min-[701px]:grid"
          aria-hidden="true"
        >
          <div className="banner-ring" />
          <div className="banner-paw">
            <Icon name="paw" />
          </div>
          <div className="banner-heart">
            <Icon name="heart" />
          </div>
          <span className="art-label">Cada vida cuenta.</span>
        </div>
      </section>
    </>
  )
}
