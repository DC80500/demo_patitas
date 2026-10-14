const paths = {
  search: 'M11 3a8 8 0 1 0 0 16 8 8 0 1 0 0-16 m6 14 4 4',
  edit: 'm16 3 5 5-12 12-6 1 1-6Z M14 5l5 5',
  paw: 'M12 14c-3 0-6 3-6 5 0 3 4 1 6 1s6 2 6-1c0-2-3-5-6-5 M5 6a2 3 0 1 0 0 6 2 3 0 1 0 0-6 M10 2a2 3 0 1 0 0 6 2 3 0 1 0 0-6 M15 2a2 3 0 1 0 0 6 2 3 0 1 0 0-6 M20 6a2 3 0 1 0 0 6 2 3 0 1 0 0-6',
  home: 'm3 10 9-7 9 7 M5 9v12h14V9 M9 21v-8h6v8',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8 M18 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  medical: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z',
  calendar:
    'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z M8 14h2 M14 14h2 M8 18h2',
  shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7Z m-4 9 3 3 5-5',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
  arrow: 'M4 12h16 m-6-6 6 6-6 6',
  logout: 'M9 3H4v18h5 M10 12h11 m-5-5 5 5-5 5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  close: 'm6 6 12 12 M6 18 18 6',
  check: 'm5 12 4 4 10-10',
  mail: 'M3 5h18v14H3Z m0 0 9 7 9-7',
  lock: 'M5 10h14v11H5Z M8 10V6a4 4 0 0 1 8 0v4 M12 14v3',
} as const

export type IconName = keyof typeof paths
export function Icon({
  name,
  className = '',
}: {
  name: IconName
  className?: string
}) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
