import type { PresentationDataReset } from '../../application/demo/PresentationDataReset'
import { demoTutors } from '../tutors/demoTutors.ts'
import { demoPets } from '../pets/demoPets.ts'
import { demoClinicalEntries } from '../clinical/demoClinicalEntries.ts'
import { demoStorageKeys as keys } from './demoStorageKeys.ts'

export class LocalPresentationDataReset implements PresentationDataReset {
  private readonly storage: () => Storage
  constructor(storage: () => Storage) {
    this.storage = storage
  }

  async reset(): Promise<void> {
    let storage: Storage
    const snapshot = new Map<string, string | null>()
    try {
      storage = this.storage()
      for (const key of Object.values(keys))
        snapshot.set(key, storage.getItem(key))
    } catch {
      throw new Error(
        'No se pudo acceder a los datos. No se realizó el restablecimiento.',
      )
    }
    const initial = new Map<string, string>([
      [keys.tutors, JSON.stringify(demoTutors)],
      [keys.pets, JSON.stringify(demoPets)],
      [keys.clinical, JSON.stringify(demoClinicalEntries)],
      [keys.compact, '1'],
      [keys.addresses, '1'],
      [keys.naturalText, '1'],
      [keys.photos, '1'],
    ])
    try {
      // Se libera espacio solo de los datos de esta demo antes de escribir las fotos iniciales.
      for (const key of snapshot.keys()) storage.removeItem(key)
      for (const [key, value] of initial) storage.setItem(key, value)
    } catch {
      let restored = true
      // Quitar las nuevas copias libera espacio para recuperar las originales si faltó cuota.
      for (const key of snapshot.keys())
        try {
          storage.removeItem(key)
        } catch {
          restored = false
        }
      for (const [key, value] of snapshot)
        if (value !== null)
          try {
            storage.setItem(key, value)
          } catch {
            restored = false
          }
      throw new Error(
        restored
          ? 'No se pudieron restablecer los datos. Los datos anteriores se recuperaron; puedes reintentar.'
          : 'No se pudo completar el restablecimiento ni recuperar todos los datos anteriores. Revisa los permisos y el espacio del navegador antes de reintentar.',
      )
    }
  }
}
