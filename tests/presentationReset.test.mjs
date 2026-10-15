import test from 'node:test'
import assert from 'node:assert/strict'
import { LocalPresentationDataReset } from '../src/infrastructure/demo/LocalPresentationDataReset.ts'
import { demoStorageKeys as keys } from '../src/infrastructure/demo/demoStorageKeys.ts'
import { demoTutors } from '../src/infrastructure/tutors/demoTutors.ts'
import { demoPets } from '../src/infrastructure/pets/demoPets.ts'
import { demoClinicalEntries } from '../src/infrastructure/clinical/demoClinicalEntries.ts'
import { migrateDemoData } from '../src/infrastructure/demo/migrateDemoData.ts'
import { LocalTutorRepository } from '../src/infrastructure/tutors/LocalTutorRepository.ts'
import { LocalPetRepository } from '../src/infrastructure/pets/LocalPetRepository.ts'
import { LocalClinicalRepository } from '../src/infrastructure/clinical/LocalClinicalRepository.ts'
import { LocalGuidedStoryRepository } from '../src/infrastructure/guidedStory/LocalGuidedStoryRepository.ts'
function setup() {
  const entries = new Map()
  const storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  }
  return {
    entries,
    storage,
    resetter: new LocalPresentationDataReset(() => storage),
  }
}
test('reset restores exact examples, removes created records, legacy data and story, preserving unrelated storage', async () => {
  const { entries, storage, resetter } = setup()
  for (const key of Object.values(keys)) storage.setItem(key, 'previous-data')
  storage.setItem('other-app', 'keep-me')
  storage.setItem('patitas-demo.unrelated', 'also-keep')
  await resetter.reset()
  assert.deepEqual(await new LocalTutorRepository(storage).list(), demoTutors)
  assert.deepEqual(await new LocalPetRepository(storage).list(), demoPets)
  assert.deepEqual(
    await new LocalClinicalRepository(storage).list(),
    demoClinicalEntries,
  )
  assert.equal(await new LocalGuidedStoryRepository(() => storage).load(), null)
  for (const key of [keys.legacyTutors, keys.legacyPets, keys.legacyClinical])
    assert.equal(storage.getItem(key), null)
  assert.equal(storage.getItem('other-app'), 'keep-me')
  assert.equal(storage.getItem('patitas-demo.unrelated'), 'also-keep')
  const snapshot = new Map(entries)
  migrateDemoData(storage)
  assert.deepEqual(entries, snapshot)
  assert.equal(demoPets.filter((pet) => pet.status === 'Pendiente').length, 1)
  assert.ok(
    demoPets.every((pet) => pet.photo.startsWith('data:image/jpeg;base64,')),
  )
})
test('repeated reset remains consistent and the guided story can start from scratch', async () => {
  const { entries, storage, resetter } = setup()
  await resetter.reset()
  const first = new Map(entries)
  const story = new LocalGuidedStoryRepository(() => storage)
  await story.save({ step: 'tutor', paused: false })
  assert.ok(await story.load())
  await resetter.reset()
  assert.deepEqual(entries, first)
  assert.equal(await story.load(), null)
})
test('temporary write failure restores all original strings without reporting success', async () => {
  const { entries, storage, resetter } = setup()
  for (const key of Object.values(keys)) storage.setItem(key, `original:${key}`)
  storage.setItem('unrelated', 'untouched')
  const snapshot = new Map(entries)
  const write = storage.setItem
  let fail = true
  storage.setItem = (key, value) => {
    if (key === keys.pets && fail) {
      fail = false
      throw new Error('quota')
    }
    write(key, value)
  }
  await assert.rejects(resetter.reset(), /datos anteriores se recuperaron/)
  assert.deepEqual(entries, snapshot)
  await resetter.reset()
  assert.equal(JSON.parse(storage.getItem(keys.pets)).length, 4)
})
test('storage access failure leaves existing data unchanged', async () => {
  const { entries, storage } = setup()
  storage.setItem(keys.tutors, 'original')
  const snapshot = new Map(entries)
  const resetter = new LocalPresentationDataReset(() => {
    throw new Error('blocked')
  })
  await assert.rejects(resetter.reset(), /No se pudo acceder/)
  assert.deepEqual(entries, snapshot)
})
test('persistent failure reports incomplete recovery rather than claiming success', async () => {
  const { storage, resetter } = setup()
  storage.setItem(keys.tutors, 'original')
  storage.setItem = () => {
    throw new Error('blocked')
  }
  await assert.rejects(resetter.reset(), /ni recuperar todos los datos/)
})
