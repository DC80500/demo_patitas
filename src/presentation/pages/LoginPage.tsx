import { useState, type FormEvent } from 'react'
import type { SignIn } from '../../application/auth/SignIn'
import type { Credentials } from '../../application/auth/Credentials'
import type { User } from '../../domain/auth/User'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { AnimatedPetIllustration } from '../components/AnimatedPetIllustration'

export function LoginPage({
  signIn,
  onSignIn,
  initialCredentials,
}: {
  signIn: SignIn
  onSignIn: (user: User) => void
  initialCredentials: Readonly<Credentials>
}) {
  const [email, setEmail] = useState(initialCredentials.email)
  const [password, setPassword] = useState(initialCredentials.password)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      onSignIn(await signIn.execute(email, password))
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No pudimos iniciar sesión. Inténtalo nuevamente.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-svh grid-cols-1 gap-6 min-[701px]:grid-cols-2 min-[701px]:p-6">
      <section className="login-story" aria-labelledby="story-title">
        <Brand />
        <div className="story-content my-auto pt-16">
          <span className="eyebrow light">CUIDAMOS LO QUE MÁS QUIERES</span>
          <h1 id="story-title">
            Cada patita tiene
            <br />
            una historia.
            <br />
            <span>Cuidémosla juntos.</span>
          </h1>
          <p>
            Un espacio para acompañar su vida, proteger su identidad y cuidar su
            bienestar.
          </p>
          <AnimatedPetIllustration />
        </div>
        <p className="story-footer">
          Con amor, respeto y dignidad por los animales.
        </p>
      </section>
      <section
        className="flex min-w-0 flex-col justify-center bg-transparent px-3 pt-6 pb-[1.2rem] max-[700px]:min-h-svh min-[381px]:px-4 min-[701px]:px-[clamp(.5rem,2vw,2rem)] min-[701px]:pt-8 min-[701px]:pb-4"
        aria-labelledby="login-title"
      >
        <div className="mobile-brand mx-auto w-full max-w-[26rem] min-[701px]:hidden">
          <Brand />
        </div>
        <div className="login-card mx-auto mt-[1.8rem] w-full max-w-[30rem] rounded-panel border border-glass-edge bg-glass p-[1.15rem] shadow-glass min-[381px]:p-6 min-[701px]:my-auto min-[701px]:p-[clamp(1.5rem,3vw,2.5rem)] min-[1500px]:max-w-[29rem]">
          <span className="pill">
            <span className="inline-block size-[.4rem] shrink-0 rounded-full bg-current" />{' '}
            Portal de gestión
          </span>
          <h2 id="login-title">Te damos la bienvenida</h2>
          <p className="muted login-intro">
            Ingresa a tu cuenta para seguir haciendo la diferencia.
          </p>
          <form onSubmit={handleSubmit} aria-label="Iniciar sesión">
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <div className={`input-wrap ${error ? 'input-invalid' : ''}`}>
                <Icon name="mail" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="nombre@correo.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError('')
                  }}
                  required
                  maxLength={254}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <div className={`input-wrap ${error ? 'input-invalid' : ''}`}>
                <Icon name="lock" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  required
                  maxLength={128}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  aria-pressed={showPassword}
                >
                  <Icon name="eye" />
                </button>
              </div>
            </div>
            {error && (
              <p id="login-error" className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button primary login-submit"
              disabled={busy}
              aria-busy={busy}
              type="submit"
            >
              {busy ? 'Ingresando…' : 'Iniciar sesión'}
              <Icon name="arrow" />
            </button>
          </form>
          <p className="mt-6 text-center text-xs leading-[1.6] text-muted">
            ¿Necesitas acceso? Comunícate con el equipo de Patitas de Amor.
          </p>
        </div>
        <footer className="mx-auto mt-8 flex w-full max-w-[26rem] flex-wrap justify-between gap-4 text-xs text-muted min-[701px]:mt-4">
          © {new Date().getFullYear()} Patitas de Amor
          <span>Hecho para cuidar.</span>
        </footer>
      </section>
    </main>
  )
}
