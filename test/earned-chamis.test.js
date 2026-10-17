import assert from 'node:assert/strict'
import test from 'node:test'
import { chamiSprites, normalizeEarnedChamis, mergeEarnedChamis } from '../shared/earned-chamis.js'

const [cheerful, sleepy, determined] = chamiSprites

test('reloading a saved collection preserves repeated wins beyond the number of sprite types', () => {
  const saved = JSON.parse(JSON.stringify(Array(25).fill(cheerful)))
  assert.deepEqual(normalizeEarnedChamis(saved), saved)
})

test('invalid entries are removed without collapsing valid acquisitions', () => {
  assert.deepEqual(normalizeEarnedChamis([cheerful, null, '/missing.png', cheerful]), [cheerful, cheerful])
  assert.deepEqual(normalizeEarnedChamis(null), [])
})

test('another win with an already collected sprite increases the persisted count', () => {
  const stored = [cheerful, cheerful, sleepy]
  const local = [...stored, cheerful]
  assert.deepEqual(mergeEarnedChamis(stored, local), local)
  assert.deepEqual(stored, [cheerful, cheerful, sleepy])
})

test('replaying the same sync never counts the same saved acquisitions twice', () => {
  const local = Array(25).fill(cheerful)
  let stored = []
  for (let attempt = 0; attempt < 10; attempt += 1) stored = mergeEarnedChamis(stored, local)
  assert.deepEqual(stored, local)
})

test('a stale browser snapshot cannot reduce a newer DB collection', () => {
  const stored = [cheerful, cheerful, cheerful, sleepy]
  assert.deepEqual(mergeEarnedChamis(stored, [cheerful, sleepy]), stored)
})

test('merging partial collections preserves the larger acquired count of each sprite', () => {
  const stored = [cheerful, sleepy, cheerful]
  const local = [sleepy, determined, sleepy, cheerful, cheerful, cheerful]
  const merged = mergeEarnedChamis(stored, local)
  assert.deepEqual(merged, [cheerful, sleepy, cheerful, determined, sleepy, cheerful])
  assert.deepEqual(mergeEarnedChamis(merged, local), merged)
  assert.deepEqual(mergeEarnedChamis(merged, stored), merged)
})

test('cleared local storage can restore all copies from the DB', () => {
  const stored = [...chamiSprites, cheerful, cheerful]
  const restored = normalizeEarnedChamis(JSON.parse(JSON.stringify(mergeEarnedChamis(stored, []))))
  assert.deepEqual(restored, stored)
  assert.equal(restored.length, 20)
})
