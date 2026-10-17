export const defaultResearcherName = '익명 연구원'
export const nicknameMaxLength = 16

export function validateResearcherMessage(value) {
  if (typeof value !== 'string') throw new Error('한마디를 텍스트로 입력해주세요.')
  const message = value.normalize('NFC').trim()
  if ([...message].length > 60) throw new Error('한마디는 60자 이내로 입력해주세요.')
  if (/[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(message)) throw new Error('한마디에는 줄바꿈이나 보이지 않는 문자를 쓸 수 없어요.')
  return message
}

export function displayResearcherMessage(value) {
  try { return validateResearcherMessage(value) } catch { return '' }
}

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
  const profile = { nickname: '', updatedAt: 0 }
  if (input.nickname !== '' || input.updatedAt !== 0) {
    if (!Number.isSafeInteger(input.updatedAt) || input.updatedAt <= 0) throw new Error('Invalid nickname revision.')
    profile.nickname = validateNickname(input.nickname)
    profile.updatedAt = input.updatedAt
  }
  if (input.message !== undefined || input.messageUpdatedAt !== undefined) {
    if (!Number.isSafeInteger(input.messageUpdatedAt) || input.messageUpdatedAt < 0) throw new Error('Invalid message revision.')
    profile.message = validateResearcherMessage(input.message)
    if (profile.message && input.messageUpdatedAt === 0) throw new Error('Invalid message revision.')
    profile.messageUpdatedAt = input.messageUpdatedAt
  }
  return profile
}

export function normalizeResearcherProfile(input) {
  try { return parseResearcherProfile(input) } catch { return { nickname: '', updatedAt: 0 } }
}

export function mergeResearcherProfiles(existingInput, incomingInput) {
  const existing = normalizeResearcherProfile(existingInput)
  const incoming = normalizeResearcherProfile(incomingInput)
  // Older responses and tabs without a nickname must not undo a confirmed edit.
  const nickname = incoming.updatedAt > existing.updatedAt ? incoming : existing
  const message = (incoming.messageUpdatedAt || 0) > (existing.messageUpdatedAt || 0) ? incoming : existing
  return {
    nickname: nickname.nickname,
    updatedAt: nickname.updatedAt,
    ...(message.messageUpdatedAt !== undefined ? { message: message.message, messageUpdatedAt: message.messageUpdatedAt } : {}),
  }
}

export function displayResearcherName(nickname) {
  try { return validateNickname(nickname) } catch { return defaultResearcherName }
}
