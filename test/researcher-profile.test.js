import assert from 'node:assert/strict'
import test from 'node:test'
import { validateNickname, parseResearcherProfile, normalizeResearcherProfile, mergeResearcherProfiles, displayResearcherName } from '../shared/researcher-profile.js'

test('existing visitors and old ranking caches keep the anonymous display name', () => {
  assert.deepEqual(parseResearcherProfile(undefined), { nickname: '', updatedAt: 0 })
  assert.equal(displayResearcherName(undefined), '익명 연구원')
  assert.equal(displayResearcherName(''), '익명 연구원')
})

test('Korean names are trimmed and normalized without losing the chosen name', () => {
  assert.equal(validateNickname('  달콤한 차미  '), '달콤한 차미')
  assert.equal(validateNickname('\u110e\u1161\u1106\u1175'), '차미')
  assert.equal(validateNickname('차미'.repeat(8)), '차미'.repeat(8))
})

test('empty, oversized and invisible or multiline names cannot be registered', () => {
  for (const nickname of ['', '   ', '가'.repeat(17), '연구\n원', '연구\u202e원', '연구\u200b원', '\ud800']) {
    assert.throws(() => validateNickname(nickname))
  }
})

test('a confirmed rename survives an older in-flight sync response', () => {
  const oldResponse = { nickname: '옛 이름', updatedAt: 100 }
  const confirmed = { nickname: '새 이름', updatedAt: 200 }
  assert.deepEqual(mergeResearcherProfiles(oldResponse, confirmed), confirmed)
  assert.deepEqual(mergeResearcherProfiles(confirmed, oldResponse), confirmed)
})

test('a cleared browser profile and old clients cannot erase a saved DB nickname', () => {
  const database = { nickname: '차미 수집가', updatedAt: 200 }
  assert.deepEqual(mergeResearcherProfiles(database, null), database)
  assert.deepEqual(mergeResearcherProfiles(null, database), database)
  assert.deepEqual(mergeResearcherProfiles(database, { nickname: '', updatedAt: 0 }), database)
})

test('the DB profile is authoritative when two edits have the same revision', () => {
  const database = { nickname: '저장된 이름', updatedAt: 200 }
  assert.deepEqual(mergeResearcherProfiles(database, { nickname: '다른 이름', updatedAt: 200 }), database)
})

test('profiles contain display metadata only, with no score or identity fields', () => {
  assert.deepEqual(parseResearcherProfile({ nickname: '차미', updatedAt: 123, totalScore: 999999, visitorId: 'other' }), { nickname: '차미', updatedAt: 123 })
  for (const updatedAt of [-1, 1.5, '123', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => parseResearcherProfile({ nickname: '차미', updatedAt }))
  }
  assert.deepEqual(normalizeResearcherProfile({ nickname: '차미', updatedAt: -1 }), { nickname: '', updatedAt: 0 })
})

test('literal punctuation in a name remains text instead of being interpreted as markup', () => {
  assert.equal(displayResearcherName('<차미 & 친구>'), '<차미 & 친구>')
})
