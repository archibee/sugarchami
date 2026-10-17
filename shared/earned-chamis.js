export const chamiSprites = [
  'chami-cheerful', 'chami-sleepy', 'chami-determined', 'chami-surprised', 'chami-dozy', 'chami-sparkle',
  'chami-cheering', 'chami-yawning', 'chami-curious', 'chami-bashful', 'chami-grumpy', 'chami-dizzy',
  'chami-triple-leaf', 'chami-curled-leaf', 'chami-double-sprout', 'chami-mint-leaf', 'chami-dew-leaf', 'chami-pear-shape',
].map((name) => `/images/variants/chami/${name}.png`)

export function normalizeEarnedChamis(value) {
  return Array.isArray(value) ? value.filter((sprite) => chamiSprites.includes(sprite)) : []
}

export function mergeEarnedChamis(existing, incoming) {
  const merged = [...existing]
  const remaining = new Map()
  for (const sprite of existing) remaining.set(sprite, (remaining.get(sprite) || 0) + 1)

  // Match copies already stored; append only additional acquisitions of each sprite.
  // Replaying a sync keeps the same count while repeated wins remain separate copies.
  for (const sprite of incoming) {
    const count = remaining.get(sprite) || 0
    if (count > 0) remaining.set(sprite, count - 1)
    else merged.push(sprite)
  }
  return merged
}
