import type { Tutor } from '../tutors/Tutor'
import type { Pet } from '../pets/Pet'
import type { ClinicalEntry } from '../clinical/ClinicalEntry'

export const storySteps = [
  'tutor',
  'pet',
  'approval',
  'dni',
  'clinical',
  'complete',
] as const
export type StoryStep = (typeof storySteps)[number]
export interface GuidedStory {
  step: StoryStep
  paused: boolean
  tutorId?: string
  petId?: string
  entryId?: string
}
export type StoryEvent =
  | { type: 'tutor-created'; tutor: Tutor }
  | { type: 'pet-created'; pet: Pet }
  | { type: 'pet-approved'; pet: Pet }
  | { type: 'dni-viewed'; petId: string }
  | { type: 'attention-created'; entry: ClinicalEntry }

export function newGuidedStory(): GuidedStory {
  return { step: 'tutor', paused: false }
}
export function isGuidedStory(value: unknown): value is GuidedStory {
  if (!value || typeof value !== 'object') return false
  const state = value as Record<string, unknown>
  if (
    !storySteps.includes(state.step as StoryStep) ||
    typeof state.paused !== 'boolean'
  )
    return false
  for (const field of ['tutorId', 'petId', 'entryId'])
    if (
      state[field] !== undefined &&
      (typeof state[field] !== 'string' || !state[field])
    )
      return false
  const step = storySteps.indexOf(state.step as StoryStep)
  return (
    (step === 0 || Boolean(state.tutorId)) &&
    (step < 2 || Boolean(state.petId)) &&
    (step < 5 || Boolean(state.entryId))
  )
}
export function advanceStory(
  story: GuidedStory,
  event: StoryEvent,
): GuidedStory {
  if (story.paused) throw new Error('Retoma el recorrido para continuar.')
  if (
    event.type === 'tutor-created' &&
    story.step === 'tutor' &&
    event.tutor.id
  )
    return { step: 'pet', paused: false, tutorId: event.tutor.id }
  if (
    event.type === 'pet-created' &&
    story.step === 'pet' &&
    event.pet.id &&
    event.pet.tutorId === story.tutorId
  )
    return { ...story, step: 'approval', petId: event.pet.id }
  if (
    event.type === 'pet-approved' &&
    story.step === 'approval' &&
    event.pet.id === story.petId &&
    event.pet.tutorId === story.tutorId &&
    event.pet.status === 'Aprobado'
  )
    return { ...story, step: 'dni' }
  if (
    event.type === 'dni-viewed' &&
    story.step === 'dni' &&
    event.petId === story.petId
  )
    return { ...story, step: 'clinical' }
  if (
    event.type === 'attention-created' &&
    story.step === 'clinical' &&
    event.entry.id &&
    event.entry.petId === story.petId
  )
    return { ...story, step: 'complete', entryId: event.entry.id }
  throw new Error(
    'Completa la acción del paso actual con los registros de esta historia.',
  )
}
export function reconcileStory(
  story: GuidedStory,
  tutors: Tutor[],
  pets: Pet[],
  entries: ClinicalEntry[],
): GuidedStory {
  if (story.step === 'tutor') return story
  if (!tutors.some((tutor) => tutor.id === story.tutorId))
    return { ...newGuidedStory(), paused: story.paused }
  if (story.step === 'pet') return story
  const pet = pets.find(
    (pet) => pet.id === story.petId && pet.tutorId === story.tutorId,
  )
  if (!pet) return { step: 'pet', paused: story.paused, tutorId: story.tutorId }
  if (story.step === 'approval')
    return pet.status === 'Aprobado' ? { ...story, step: 'dni' } : story
  if (pet.status !== 'Aprobado')
    return {
      step: 'approval',
      paused: story.paused,
      tutorId: story.tutorId,
      petId: story.petId,
    }
  if (
    story.step === 'complete' &&
    !entries.some(
      (entry) => entry.id === story.entryId && entry.petId === story.petId,
    )
  )
    return {
      step: 'clinical',
      paused: story.paused,
      tutorId: story.tutorId,
      petId: story.petId,
    }
  return story
}
