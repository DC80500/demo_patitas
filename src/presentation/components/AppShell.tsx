import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '../../domain/auth/User'
import { Brand } from './Brand'
import { Icon, type IconName } from './Icon'

const modules: {
  name: string
  icon: IconName
  page: Exclude<PanelPage, 'welcome'>
}[] = [
  {
    name: 'Gestión de Tutores',
    icon: 'heart',
    page: 'tutors',
  },
  {
    name: 'Gestión de Mascotas',
    icon: 'paw',
    page: 'pets',
  },
  {
    name: 'Historia Clínica',
    icon: 'medical',
    page: 'clinical',
  },
]
const roles = {
  administrator: 'Administrador',
  support: 'Soporte',
  operator: 'Operador',
}

export type PanelPage = 'welcome' | 'tutors' | 'pets' | 'clinical'

function Navigation({
  activePage,
  onNavigate,
}: {
  activePage: PanelPage
  onNavigate: (page: PanelPage) => void
}) {
  return (
    <nav
      aria-label="Menú principal"
      className="sidebar-navigation min-h-0 flex-1 overflow-y-auto"
    >
      <span className="nav-caption">PRINCIPAL</span>
      <button
        className={`nav-item ${activePage === 'welcome' ? 'active' : ''}`}
        aria-current={activePage === 'welcome' ? 'page' : undefined}
        onClick={() => onNavigate('welcome')}
      >
        <Icon name="home" />
        Bienvenida
      </button>
      <span className="nav-caption modules-caption">GESTIÓN</span>
      {modules.map((module) => (
        <button
          className={`nav-item ${module.page === activePage ? 'active' : ''}`}
          key={module.name}
          aria-current={module.page === activePage ? 'page' : undefined}
          onClick={() => onNavigate(module.page)}
        >
          <Icon name={module.icon} />
          <span>{module.name}</span>
        </button>
      ))}
    </nav>
  )
}

export function AppShell({
  user,
  onSignOut,
  activePage,
  onNavigate,
  children,
}: {
  user: User
  onSignOut: () => void
  activePage: PanelPage
  onNavigate: (page: PanelPage) => void
  children: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activePage])
  useEffect(() => {
    if (menuOpen) dialog.current?.showModal()
    else dialog.current?.close()
  }, [menuOpen])

  function navigate(page: PanelPage) {
    onNavigate(page)
    setMenuOpen(false)
  }
  return (
    <div className="flex min-h-svh gap-[.85rem] p-2 min-[701px]:p-[.85rem]">
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      <aside className="sidebar">
        <Brand compact />
        <Navigation activePage={activePage} onNavigate={navigate} />
        <div className="shrink-0 pt-3">
          <div className="sidebar-note">
            <Icon name="heart" />
            <p>
              Pequeñas acciones.
              <br />
              <strong>Grandes cambios.</strong>
            </p>
          </div>
          <button className="nav-item sign-out" onClick={onSignOut}>
            <Icon name="logout" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <dialog
        className="mobile-menu"
        ref={dialog}
        onCancel={() => setMenuOpen(false)}
        onClose={() => setMenuOpen(false)}
        aria-label="Navegación"
      >
        <div className="flex shrink-0 items-start justify-between gap-2">
          <Brand compact />
          <button
            className="icon-button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <Navigation activePage={activePage} onNavigate={navigate} />
        <button className="nav-item sign-out" onClick={onSignOut}>
          <Icon name="logout" />
          Cerrar sesión
        </button>
      </dialog>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="topbar">
          <div className="topbar-title flex items-center gap-[.7rem] text-xs text-muted min-[381px]:text-[.8rem]">
            <button
              className="icon-button grid min-[901px]:hidden"
              aria-label="Abrir menú"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <span>
              Inicio{' '}
              <span className="px-[.35rem] text-[#8d9cab] min-[381px]:px-3">
                /
              </span>{' '}
              <strong>
                {
                  {
                    welcome: 'Bienvenida',
                    tutors: 'Tutores',
                    pets: 'Mascotas',
                    clinical: 'Historia Clínica',
                  }[activePage]
                }
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-[.8rem]">
            <div className="user-copy hidden text-right text-xs min-[701px]:block">
              <strong>{user.name}</strong>
              <span>{roles[user.role]}</span>
            </div>
            <span className="avatar" aria-hidden="true">
              EP
            </span>
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-2 pt-[1.8rem] pb-6 min-[701px]:px-[clamp(1.25rem,3vw,3rem)] min-[901px]:pt-[2.4rem]"
        >
          {children}
          <footer className="mt-auto flex flex-col flex-wrap items-start justify-between gap-3 pt-6 text-xs leading-[1.6] text-muted min-[701px]:flex-row min-[701px]:items-center min-[701px]:gap-4">
            <span>Patitas de Amor · Con amor por los animales</span>
            <span>Versión de demostración</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
