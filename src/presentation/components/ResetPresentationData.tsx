import { useEffect, useRef, useState } from 'react'
import type { PresentationDataReset } from '../../application/demo/PresentationDataReset'
import { Modal } from './Modal'
import { Icon } from './Icon'

export function ResetPresentationData({
  resetter,
  onReset,
}: {
  resetter: PresentationDataReset
  onReset: () => void
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)
  useEffect(() => {
    if (!open && restoreFocus.current) {
      trigger.current?.focus()
      restoreFocus.current = false
    }
  }, [open])
  function close() {
    if (busy) return
    setOpen(false)
  }
  async function reset() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await resetter.reset()
      onReset()
      setOpen(false)
      setDone(true)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudieron restablecer los datos.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="presentation-reset-area">
      {done && (
        <div className="success-notice" role="status">
          <Icon name="check" />
          <span>
            Presentación restablecida. Los ejemplos iniciales están disponibles
            y puedes comenzar un nuevo recorrido.
          </span>
          <button
            className="icon-button"
            aria-label="Cerrar aviso de restablecimiento"
            onClick={() => setDone(false)}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      <div className="presentation-reset-row">
        <p className="muted">
          Vuelve a los ejemplos iniciales para preparar otra presentación.
        </p>
        <button
          ref={trigger}
          type="button"
          className="presentation-reset-link"
          onClick={() => {
            restoreFocus.current = true
            setError('')
            setDone(false)
            setOpen(true)
          }}
        >
          <Icon name="settings" />
          Restablecer datos de presentación
        </button>
      </div>
      {open && (
        <Modal
          title="¿Restablecer la presentación?"
          eyebrow="PREPARAR UNA NUEVA PRESENTACIÓN"
          onClose={close}
        >
          <div className="modal-body">
            <p className="text-sm leading-7">
              Esta acción reemplazará los datos actuales de la presentación
              guardados en este navegador:
            </p>
            <ul className="reset-consequences">
              <li>
                Se eliminarán los tutores, mascotas y atenciones que hayas
                añadido, junto con los cambios realizados en los ejemplos.
              </li>
              <li>
                Se recuperarán los{' '}
                <strong>3 tutores y 4 mascotas iniciales</strong>, con sus
                fotografías y los historiales de ejemplo.
              </li>
              <li>
                Se reiniciará el progreso del recorrido guiado para comenzar
                desde el primer paso.
              </li>
            </ul>
            <p className="muted text-sm">
              Esta acción no se puede deshacer desde la aplicación.
            </p>
            {error && (
              <p className="form-error mt-5" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={close}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="button reset-confirm-button"
              onClick={() => void reset()}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? 'Restableciendo…' : 'Restablecer datos'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
