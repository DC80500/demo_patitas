import test from 'node:test'
import assert from 'node:assert/strict'
import { createShuffleBag } from '../src/presentation/utils/createShuffleBag.ts'

test('every cycle contains all figures and never repeats its boundary', () => {
  const figures = ['dog-paw', 'cat-paw', 'dog-face', 'cat-face']
  for (const random of [() => 0, () => 0.999999, Math.random]) {
    const next = createShuffleBag(figures, random, figures[0])
    let last = figures[0]
    for (let cycle = 0; cycle < 100; cycle++) {
      const seen = new Set()
      for (let index = 0; index < figures.length; index++) {
        const current = next()
        assert.notEqual(current, last)
        seen.add(current)
        last = current
      }
      assert.deepEqual(seen, new Set(figures))
    }
  }
})

test('rejects bags with duplicates or fewer than two items', () => {
  for (const values of [[], ['dog'], ['dog', 'dog']]) {
    assert.throws(() => createShuffleBag(values))
  }
})
