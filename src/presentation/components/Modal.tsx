import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

export function Modal({
  title,
  onClose,
  children,
  eyebrow = 'GESTIÓN DE TUTORES',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  eyebrow?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="record-modal"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      aria-label={title}
    >
      <div className="modal-header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Cerrar ventana"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  )
}
