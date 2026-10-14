import type { ClinicalEntry } from '../../domain/clinical/ClinicalEntry'
export interface ClinicalRepository {
  list(): Promise<ClinicalEntry[]>
  save(entry: ClinicalEntry): Promise<void>
}
