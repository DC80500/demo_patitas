import type { Tutor } from '../../domain/tutors/Tutor'

export interface TutorRepository {
  list(): Promise<Tutor[]>
  save(tutor: Tutor): Promise<void>
}
