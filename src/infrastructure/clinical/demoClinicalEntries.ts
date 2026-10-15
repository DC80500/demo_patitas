import type { ClinicalEntry } from '../../domain/clinical/ClinicalEntry'
const defaults = {
  veterinarian: 'M.V. Mariana Salazar',
  reason: '',
  diagnosis: '',
  treatment: '',
  vaccine: '',
  notes: '',
  nextVisit: '',
}
export const demoClinicalEntries: ClinicalEntry[] = [
  {
    ...defaults,
    id: 'clinical-1',
    petId: 'pet-1',
    kind: 'Consulta',
    date: '2026-09-05',
    reason: 'Control de bienestar',
    diagnosis: 'Buen estado general durante la evaluación clínica.',
    treatment: 'Seguimiento en el próximo control.',
    notes:
      'Se revisó el estado general y se actualizaron los datos de la ficha.',
    nextVisit: '2026-10-20',
  },
  {
    ...defaults,
    id: 'clinical-2',
    petId: 'pet-1',
    kind: 'Vacuna',
    date: '2026-09-15',
    vaccine: 'Antirrábica',
    notes: 'Aplicación registrada en el carné de vacunación.',
    nextVisit: '2026-11-15',
  },
  {
    ...defaults,
    id: 'clinical-3',
    petId: 'pet-2',
    kind: 'Consulta',
    date: '2026-09-10',
    reason: 'Consulta de rutina',
    diagnosis: 'Sin alteraciones en la evaluación general.',
    treatment: 'Continuar con los controles habituales.',
    notes: 'Se revisó el historial y se orientó al tutor sobre el seguimiento.',
  },
]
