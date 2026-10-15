import type { GuidedStoryRepository } from '../../application/guidedStory/GuidedStoryRepository'
import {
  isGuidedStory,
  type GuidedStory,
} from '../../domain/guidedStory/GuidedStory.ts'
import { demoStorageKeys } from '../demo/demoStorageKeys.ts'
const KEY = demoStorageKeys.story
export class LocalGuidedStoryRepository implements GuidedStoryRepository {
  private readonly storage: () => Storage
  constructor(storage: () => Storage) {
    this.storage = storage
  }
  async load(): Promise<GuidedStory | null> {
    const raw = this.storage().getItem(KEY)
    if (raw === null) return null
    try {
      const story: unknown = JSON.parse(raw)
      if (!isGuidedStory(story)) throw new Error('invalid')
      return story
    } catch {
      throw new Error(
        'No se pudo recuperar el recorrido guardado. Puedes iniciar uno nuevo; tus tutores y mascotas se conservarán.',
      )
    }
  }
  async save(story: GuidedStory): Promise<void> {
    if (!isGuidedStory(story))
      throw new Error('El progreso del recorrido no es válido.')
    try {
      this.storage().setItem(KEY, JSON.stringify(story))
    } catch {
      throw new Error(
        'No se pudo conservar el progreso del recorrido. Los registros que hayas guardado se mantienen. Puedes seguir aquí o reintentar guardar el progreso antes de recargar.',
      )
    }
  }
}
