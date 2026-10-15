import type { GuidedStory } from '../../domain/guidedStory/GuidedStory'
export interface GuidedStoryRepository {
  load(): Promise<GuidedStory | null>
  save(story: GuidedStory): Promise<void>
}
