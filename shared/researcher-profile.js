export const defaultResearcherName = '익명 연구원'
export const nicknameMaxLength = 16

export function validateNickname(value) {
  if (typeof value !== 'string') throw new Error('닉네임을 입력해주세요.')
  const nickname = value.normalize('NFC').trim()
  if (!nickname || [...nickname].length > nicknameMaxLength) throw new Error('닉네임은 1~16자로 입력해주세요.')
  if (/[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(nickname)) throw new Error('닉네임에는 줄바꿈이나 보이지 않는 문자를 쓸 수 없어요.')
  return nickname
}

export function parseResearcherProfile(input) {
  if (input == null) return { nickname: '', updatedAt: 0 }
  if (typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid researcher profile.')
  if (input.nickname === '' && input.updatedAt === 0) return { nickname: '', updatedAt: 0 }
  if (!Number.isSafeInteger(input.updatedAt) || input.updatedAt <= 0) throw new Error('Invalid nickname revision.')
  return { nickname: validateNickname(input.nickname), updatedAt: input.updatedAt }
}

export function normalizeResearcherProfile(input) {
  try { return parseResearcherProfile(input) } catch { return { nickname: '', updatedAt: 0 } }
}

export function mergeResearcherProfiles(existingInput, incomingInput) {
  const existing = normalizeResearcherProfile(existingInput)
  const incoming = normalizeResearcherProfile(incomingInput)
  // Older responses and tabs without a nickname must not undo a confirmed edit.
  return incoming.updatedAt > existing.updatedAt ? incoming : existing
}

export function displayResearcherName(nickname) {
  try { return validateNickname(nickname) } catch { return defaultResearcherName }
}
