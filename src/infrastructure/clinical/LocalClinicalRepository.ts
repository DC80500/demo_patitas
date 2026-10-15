import type { ClinicalRepository } from '../../application/clinical/ClinicalRepository'
import {
  validateClinical,
  type ClinicalEntry,
} from '../../domain/clinical/ClinicalEntry.ts'
import { demoClinicalEntries } from './demoClinicalEntries.ts'
import { demoStorageKeys } from '../demo/demoStorageKeys.ts'
const KEY = demoStorageKeys.clinical
export function isEntry(value: unknown): value is ClinicalEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  if (
    ![
      'id',
      'petId',
      'kind',
      'date',
      'veterinarian',
      'reason',
      'diagnosis',
      'treatment',
      'vaccine',
      'notes',
      'nextVisit',
    ].every((key) => typeof entry[key] === 'string')
  )
    return false
  return (
    Boolean(entry.id) &&
    Object.keys(validateClinical(entry as unknown as ClinicalEntry)).length ===
      0
  )
}
export class LocalClinicalRepository implements ClinicalRepository {
  private readonly storage: Storage | (() => Storage)
  constructor(storage: Storage | (() => Storage)) {
    this.storage = storage
  }
  private getStorage() {
    return typeof this.storage === 'function' ? this.storage() : this.storage
  }
  async list(): Promise<ClinicalEntry[]> {
    let raw: string | null
    try {
      raw = this.getStorage().getItem(KEY)
    } catch {
      throw new Error(
        'No se pudo acceder al almacenamiento local de historia clínica.',
      )
    }
    if (raw === null) {
      const seed = structuredClone(demoClinicalEntries)
      this.write(seed)
      return seed
    }
    try {
      const entries: unknown = JSON.parse(raw)
      if (
        !Array.isArray(entries) ||
        !entries.every(isEntry) ||
        new Set(entries.map((entry) => entry.id)).size !== entries.length
      )
        throw new Error('invalid')
      return entries
    } catch {
      throw new Error(
        'Los datos locales de historia clínica no son válidos. No se modificaron los registros.',
      )
    }
  }
  async save(entry: ClinicalEntry) {
    const entries = await this.list()
    if (entries.some((item) => item.id === entry.id))
      throw new Error('Esta atención ya está registrada.')
    this.write([...entries, entry])
  }
  private write(entries: ClinicalEntry[]) {
    try {
      this.getStorage().setItem(KEY, JSON.stringify(entries))
    } catch {
      throw new Error(
        'No se pudo guardar la atención. El almacenamiento local puede estar lleno o bloqueado.',
      )
    }
  }
}
