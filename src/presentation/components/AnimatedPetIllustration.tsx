import { useEffect, useRef, useState } from 'react'
import { createShuffleBag } from '../utils/createShuffleBag'
import { Icon } from './Icon'

const figures = ['dog-paw', 'cat-paw', 'dog-face', 'cat-face'] as const
type Figure = (typeof figures)[number]
const paths: Record<Figure, string> = {
  'dog-paw':
    'M24 26c-6 0-12 6-12 11 0 6 7 3 12 3s12 3 12-3c0-5-6-11-12-11Z M9 14a3 5 0 1 0 0 10 3 5 0 1 0 0-10 M19 7a3 5 0 1 0 0 10 3 5 0 1 0 0-10 M29 7a3 5 0 1 0 0 10 3 5 0 1 0 0-10 M39 14a3 5 0 1 0 0 10 3 5 0 1 0 0-10',
  'cat-paw':
    'M24 27c-4-5-9 1-11 5-3 5-1 9 4 8 5-2 9-2 14 0 5 1 7-3 4-8-2-4-7-10-11-5Z M11 16a3 4 0 1 0 0 8 3 4 0 1 0 0-8 M20 9a3 4 0 1 0 0 8 3 4 0 1 0 0-8 M28 9a3 4 0 1 0 0 8 3 4 0 1 0 0-8 M37 16a3 4 0 1 0 0 8 3 4 0 1 0 0-8',
  'dog-face':
    'M13 17c-6-8-10-3-9 6 0 7 3 8 8 3 M35 17c6-8 10-3 9 6 0 7-3 8-8 3 M13 14c4-5 18-5 22 0l2 14c1 8-5 13-13 13S10 36 11 28Z M18 23h.1 M30 23h.1 M21 29h6l-3 4Z M24 33v3 M19 35q5 5 10 0',
  'cat-face':
    'M10 23 8 7l12 8q4-2 8 0L40 7l-2 16c5 10-2 18-14 18S5 33 10 23Z M17 24h.1 M31 24h.1 M21 29h6l-3 3Z M24 32v3 M19 34q5 5 10 0 M5 28l10 2 M4 34l11-1 M33 30l10-2 M33 33l11 1',
}

export function AnimatedPetIllustration() {
  const [cards, setCards] = useState<
    { id: number; figure: Figure; slot: number }[]
  >([{ id: 0, figure: 'dog-paw', slot: 0 }])
  const illustration = useRef<HTMLDivElement>(null)
  const sequence = useRef(0)
  const lastFigure = useRef<Figure>('dog-paw')

  useEffect(() => {
    const next = createShuffleBag(figures, Math.random, lastFigure.current)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const visibleLayout = window.matchMedia('(min-width: 701px)')
    let timer: ReturnType<typeof setTimeout> | undefined

    function schedule() {
      clearTimeout(timer)
      const paused =
        reducedMotion.matches || !visibleLayout.matches || document.hidden
      if (illustration.current)
        illustration.current.dataset.paused = String(paused)
      if (paused) return
      timer = setTimeout(() => {
        const card = {
          id: ++sequence.current,
          figure: next(),
          slot: sequence.current % 3,
        }
        lastFigure.current = card.figure
        setCards((current) => [
          ...current
            .filter((visible) => visible.figure !== card.figure)
            .slice(-2),
          card,
        ])
        schedule()
      }, 3200)
    }

    schedule()
    reducedMotion.addEventListener('change', schedule)
    visibleLayout.addEventListener('change', schedule)
    document.addEventListener('visibilitychange', schedule)
    return () => {
      clearTimeout(timer)
      reducedMotion.removeEventListener('change', schedule)
      visibleLayout.removeEventListener('change', schedule)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [])

  return (
    <div ref={illustration} className="story-illustration" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="pet-deck">
        {cards.map((card) => (
          <span
            key={card.id}
            className="paw-circle pet-card"
            data-slot={card.slot}
          >
            <svg
              className="pet-figure"
              data-figure={card.figure}
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={paths[card.figure]} />
            </svg>
          </span>
        ))}
      </div>
      <span className="floating-heart">
        <Icon name="heart" />
      </span>
      <div className="care-note">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e7f5fd] text-primary">
          <Icon name="check" />
        </span>
        <div>
          <strong>Siempre parte de la familia</strong>
          <span>Identidad · Salud · Protección</span>
        </div>
      </div>
    </div>
  )
}
