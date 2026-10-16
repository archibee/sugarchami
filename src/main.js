import './style.css'

document.addEventListener('dragstart', (event) => {
  if (event.target instanceof Element && event.target.closest('#app')) event.preventDefault()
})

if (window.matchMedia('(pointer: coarse)').matches) {
  document.addEventListener('dblclick', (event) => event.preventDefault(), { passive: false })
  for (const eventName of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(eventName, (event) => event.preventDefault(), { passive: false })
  }
}

const app = document.querySelector('#app')
const mobileHeroLayout = window.matchMedia('(max-width: 760px)')
const sampleCount = 6
const saveKey = 'chami-sugar-lab-research-v1'
const trophyTiers = [
  { id: 'silver', name: '실버', minimum: 160, icon: '🥈' },
  { id: 'gold', name: '골드', minimum: 500, icon: '🥇' },
  { id: 'platinum', name: '플래티넘', minimum: 1200, icon: '🏆' },
  { id: 'diamond', name: '다이아', minimum: 2500, icon: '💎' },
  { id: 'master', name: '마스터', minimum: 5000, icon: '👑' },
]
const chamiSprites = [
  'chami-cheerful', 'chami-sleepy', 'chami-determined', 'chami-surprised', 'chami-dozy', 'chami-sparkle',
  'chami-cheering', 'chami-yawning', 'chami-curious', 'chami-bashful', 'chami-grumpy', 'chami-dizzy',
  'chami-triple-leaf', 'chami-curled-leaf', 'chami-double-sprout', 'chami-mint-leaf', 'chami-dew-leaf', 'chami-pear-shape',
].map((name) => `/images/variants/chami/${name}.png`)
const sitriDialogues = [
  '오늘은 어떤 차미를 만날까요?',
  '한 판 가볍게 즐겨봐요!',
  '차미의 표정을 찾아봐요!',
  '요정 시트리가 응원할게요!',
]
const sitriGameLines = {
  pop: ['차미의 당도를 살펴봐요!', '표본을 눌러 당도를 재봐요!'],
  gauge: ['초록 구간에 맞춰봐요!', '바늘을 잘 보고 눌러봐요!'],
  fizz: ['거품을 빠르게 눌러봐요!', '연속 기록에 도전해봐요!'],
  catch: ['도망가는 차미를 잡아봐요!', '움직임을 보고 톡 눌러요!'],
  memory: ['같은 차미를 찾아봐요!', '힌트는 아껴서 써봐요!'],
  mole: ['구멍 속 차미를 톡 잡아봐요!', '빠르게 눌러 기록을 올려봐요!'],
  radar: ['설명에 맞는 표정을 찾아봐요!', '차미의 표정을 잘 살펴봐요!'],
  tower: ['블록을 차곡차곡 쌓아봐요!', '천천히 타이밍을 맞춰봐요!'],
  pingpong: ['공을 끝까지 받아쳐봐요!', '차미와 함께 랠리를 이어가요!'],
  collection: ['모은 트로피를 살펴봐요!', '게임 기록이 트로피로 쌓여요!'],
  guideline: ['이용 안내를 확인해봐요!', '게임 안내를 읽어봐요!'],
  miniGames: ['마음에 드는 게임을 골라봐요!', '어떤 게임부터 해볼까요?'],
  lab: ['차미 표본을 살펴봐요!', '당도 연구를 시작해봐요!'],
  hero: ['불러줘서 반가워요!', '오늘도 함께 놀아요!'],
  default: ['함께 둘러봐요!', '어디부터 살펴볼까요?'],
}
function shuffle(items) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled
}

function randomChamiSprite() {
  return chamiSprites[Math.floor(Math.random() * chamiSprites.length)]
}

const measurementNotes = [
  '당도계가 잠깐 행복해졌습니다.',
  '시트리가 고개를 끄덕였습니다. 근거는 없습니다.',
  '측정기가 설탕을 보고 살짝 눈을 피합니다.',
  '연구소 기준으로 꽤 수상한 수치입니다.',
  '기계가 방금 작은 박수를 친 것 같습니다.',
]
let samples = []
let roundSerial = 0
let gaugeState = { running: false, target: 50, position: 50, startedAt: 0, frame: null }
let fizzState = { running: false, count: 0, endsAt: 0, timer: null }
let catchState = { running: false, count: 0, endsAt: 0, timer: null, mover: null }
let memoryState = { active: false, locked: false, hintReveal: false, hintsRemaining: 3, deck: [], open: [], matched: new Set(), moves: 0, startedAt: 0, mismatchTimer: null, clockTimer: null, hintTimer: null }
let moleState = { running: false, hits: 0, combo: 0, bestCombo: 0, endsAt: 0, timer: null, mover: null, target: -1 }
let radarState = { running: false, correct: 0, rounds: 0, endsAt: 0, timer: null, feedbackTimer: null, target: '' }
let towerState = { running: false, height: 0, width: 34, position: 0, direction: 1, speed: 0.055, frame: null, lastFrame: 0 }
let pingpongState = { active: false, hits: 0, x: 50, y: 18, vx: 0, vy: 0, paddleX: 50, frame: null, lastFrame: 0 }
let profileSyncPromise = null

function loadResearch() {
  const fresh = { completedRounds: 0, bestSugar: 0, bestMashes: 0, bestCatches: 0, catchPlays: 0, gaugePlays: 0, precisionHits: 0, mashPlays: 0, bestMemoryMoves: 0, memoryPlays: 0, memoryGolds: 0, molePlays: 0, radarPlays: 0, towerPlays: 0, pingpongPlays: 0, totalScore: 0 }
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey))
    const { badges, trophies, ...researchRecord } = saved || {}
    return { ...fresh, ...researchRecord, totalScore: Math.max(0, Math.floor(Number(researchRecord.totalScore) || 0)) }
  } catch {
    return fresh
  }
}

let research = loadResearch()

function saveResearch() {
  try {
    localStorage.setItem(saveKey, JSON.stringify(research))
  } catch {
    // Keep the current session playable when storage is unavailable.
  }
}

function addResearchScore(points) {
  const earned = Math.max(0, Math.round(Number(points) || 0))
  if (!earned) return
  research.totalScore = (Number(research.totalScore) || 0) + earned
  saveResearch()
}

function trophyTierForScore(score) {
  return [...trophyTiers].reverse().find((tier) => score >= tier.minimum)
    || { id: 'research', name: '연구 중', icon: '🏆' }
}

function applyServerProfile(profile) {
  const stats = profile.stats || {}
  const localOnly = { molePlays: research.molePlays, radarPlays: research.radarPlays, towerPlays: research.towerPlays, pingpongPlays: research.pingpongPlays, totalScore: research.totalScore || 0 }
  research = {
    completedRounds: Number(stats.completed_rounds) || 0,
    bestSugar: Number(stats.best_sugar) || 0,
    bestMashes: Number(stats.best_mashes) || 0,
    bestCatches: Number(stats.best_catches) || 0,
    catchPlays: Number(stats.catch_plays) || 0,
    gaugePlays: Number(stats.gauge_plays) || 0,
    precisionHits: Number(stats.precision_hits) || 0,
    mashPlays: Number(stats.mash_plays) || 0,
    bestMemoryMoves: Number(stats.best_memory_moves) || 0,
    memoryPlays: Number(stats.memory_plays) || 0,
    memoryGolds: Number(stats.memory_golds) || 0,
    ...localOnly,
  }
  saveResearch()
}

async function syncServerProfile() {
  try {
    const response = await fetch('/api/profile', { credentials: 'same-origin' })
    if (response.ok) applyServerProfile(await response.json())
  } catch {
    // The local research record remains available if the database is offline.
  }
}

async function submitGameEvent(event) {
  try {
    if (!profileSyncPromise) profileSyncPromise = syncServerProfile()
    await profileSyncPromise
    const response = await fetch('/api/events', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    if (response.ok) applyServerProfile(await response.json())
  } catch {
    // Do not interrupt a game round when persistent storage is unavailable.
  }
}

function makeSamples() {
  const spriteOrder = shuffle(chamiSprites)
  return Array.from({ length: sampleCount }, (_, index) => ({
    id: index + 1,
    sugar: Math.floor(Math.random() * 46) + 54,
    sprite: spriteOrder[index],
    hits: 0,
    requiredHits: Math.floor(Math.random() * 5) + 1,
    revealed: false,
  }))
}

function renderSamples(animateId = null) {
  const board = document.querySelector('#sample-board')
  board.innerHTML = samples.map((sample) => {
    const hpRatio = Math.max(0, (sample.requiredHits - sample.hits) / sample.requiredHits)
    return `
    <article class="sample ${sample.revealed ? 'is-revealed' : ''} ${sample.winner ? 'is-sweetest' : ''} ${sample.id === animateId ? 'just-measured' : ''}" data-id="${sample.id}">
      <span class="sample-number">SAMPLE 0${sample.id}</span>
      <span class="sample-figure" style="--hit-tilt:${Math.round(Math.random() * 44 - 22)}deg; --hit-shift:${Math.round(Math.random() * 28 - 14)}px">
        <img src="${sample.sprite}" alt="" loading="lazy" fetchpriority="low" decoding="async" />
        <span class="impact" aria-hidden="true">팡!${sample.revealed ? `<small>${sample.sugar}°S</small>` : `<small>${sample.hits}/${sample.requiredHits}</small>`}</span>
      </span>
      <span class="sample-hp" role="progressbar" aria-label="차미 체력" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(hpRatio * 100)}"><span style="transform:scaleX(${hpRatio})"></span></span>
      <span class="sugar-result">${sample.revealed ? `${sample.sugar}<small>°S</small>` : `<small>팡 ${sample.hits}/${sample.requiredHits}</small>`}</span>
      ${sample.winner ? '<span class="winner-tag">당도 1위 ✦</span>' : ''}
    </article>
  `
  }).join('')
}

function launchSugarBurst(sampleId) {
  const section = document.querySelector('.lab-section')
  const target = document.querySelector(`.sample[data-id="${sampleId}"] .sample-figure`)
  if (!section || !target) return
  const sectionRect = section.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const burst = document.createElement('div')
  burst.className = 'sugar-burst'
  burst.setAttribute('aria-hidden', 'true')
  burst.style.left = `${targetRect.left + targetRect.width / 2 - sectionRect.left}px`
  burst.style.top = `${targetRect.top + targetRect.height / 2 - sectionRect.top}px`
  for (let i = 0; i < 12; i += 1) {
    const spark = document.createElement('i')
    spark.style.setProperty('--spark-angle', `${i * 30}deg`)
    spark.style.setProperty('--spark-distance', `${34 + Math.random() * 45}px`)
    burst.append(spark)
  }
  const word = document.createElement('b')
  word.textContent = ['POW!', 'PANG!', 'POP!'][Math.floor(Math.random() * 3)]
  burst.append(word)
  section.append(burst)
  window.setTimeout(() => burst.remove(), 760)
}

function measureRandomSample() {
  const unfinished = samples.filter((sample) => !sample.revealed)
  if (unfinished.length === 0) return

  const sample = unfinished[Math.floor(Math.random() * unfinished.length)]
  sample.hits += 1
  sample.revealed = sample.hits >= sample.requiredHits
  renderSamples(sample.id)
  launchSugarBurst(sample.id)
  if ('vibrate' in navigator) navigator.vibrate([42, 22, 76])
  const remaining = samples.filter((item) => !item.revealed).length
  document.querySelector('#progress-count').textContent = sampleCount - remaining
  document.querySelector('#lab-status').textContent = remaining > 0
    ? sample.revealed
      ? `차미 ${String(sample.id).padStart(2, '0')} — ${sample.sugar}°S 측정 완료! ${remaining}마리가 남았어요.`
      : `차미 ${String(sample.id).padStart(2, '0')} 팡 ${sample.hits}/${sample.requiredHits}! 아직 버티고 있어요. ${remaining}마리를 더 완료해요.`
    : `마지막 차미까지 측정 완료! 당도 1위 발표를 준비합니다…`

  const popButton = document.querySelector('#pop-button')
  popButton.classList.remove('is-popping')
  requestAnimationFrame(() => popButton.classList.add('is-popping'))
  const board = document.querySelector('#sample-board')
  board.classList.remove('is-popping')
  requestAnimationFrame(() => board.classList.add('is-popping'))
  window.setTimeout(() => board.classList.remove('is-popping'), 520)
  const labSection = document.querySelector('.lab-section')
  labSection.classList.remove('is-impact')
  requestAnimationFrame(() => labSection.classList.add('is-impact'))
  window.setTimeout(() => labSection.classList.remove('is-impact'), 480)

  if (remaining === 0) {
    popButton.disabled = true
    popButton.querySelector('.pop-title').textContent = '당도왕 발표 중…'
    const currentRound = roundSerial
    window.setTimeout(() => {
      if (currentRound !== roundSerial) return

      const highest = Math.max(...samples.map((item) => item.sugar))
      const winners = samples.filter((item) => item.sugar === highest)
      submitGameEvent({ type: 'round_complete', sugars: samples.map((item) => item.sugar) })
      winners.forEach((winner) => {
        winner.winner = true
        attachChamiSatellite(winner.sprite)
      })
      research.completedRounds += 1
      research.bestSugar = Math.max(research.bestSugar, highest)
      addResearchScore(25 + Math.round(highest * 0.3))
      renderSamples()
      const winnerIds = winners.map((winner) => `차미 ${String(winner.id).padStart(2, '0')}`).join(' · ')
      document.querySelector('#winner-title').textContent = winners.length > 1 ? '공동 당도왕 탄생!' : '오늘의 당도왕!'
      document.querySelector('#winner-copy').textContent = `${winnerIds} — ${highest}°S. 당도계가 왕관을 씌우려다 설탕에 붙었습니다.`
      document.querySelector('#winner-panel').hidden = false
      document.querySelector('#winner-panel').classList.add('is-visible')
      document.querySelector('#lab-status').textContent = `최고 당도 ${highest}°S! ${winnerIds}가 오늘의 당도왕이에요. 새 표본을 시작할 수 있어요.`
      popButton.disabled = false
      popButton.querySelector('.pop-title').textContent = '다시 연구하기'
      popButton.querySelector('.pop-subtitle').textContent = '새 표본 6개'
    }, 720)
  }
}

function resetLab() {
  roundSerial += 1
  samples = makeSamples()
  renderSamples()
  document.querySelector('#lab-status').textContent = '차미마다 필요한 만큼 팡팡 눌러 여섯 표본의 측정을 완료해요.'
  document.querySelector('#progress-count').textContent = '0'
  document.querySelector('#winner-panel').hidden = true
  document.querySelector('#winner-panel').classList.remove('is-visible')
  const popButton = document.querySelector('#pop-button')
  popButton.disabled = false
  popButton.querySelector('.pop-title').textContent = '차미 팡!'
  popButton.querySelector('.pop-subtitle').innerHTML = '남은 차미 팡팡 <i aria-hidden="true">↗</i>'
}

function animateGauge(timestamp) {
  if (!gaugeState.running) return
  const phase = ((timestamp - gaugeState.startedAt) % 2200) / 2200
  gaugeState.position = phase < 0.5 ? phase * 200 : 200 - phase * 200
  document.querySelector('#gauge-needle').style.left = `${gaugeState.position}%`
  gaugeState.frame = requestAnimationFrame(animateGauge)
}

function useGauge() {
  const button = document.querySelector('#gauge-button')
  const status = document.querySelector('#gauge-status')

  if (!gaugeState.running) {
    document.querySelector('#gauge-game').classList.remove('is-precise')
    document.querySelector('#gauge-readout').textContent = '—°S'
    gaugeState.running = true
    gaugeState.target = Math.floor(Math.random() * 57) + 22
    gaugeState.position = 50
    gaugeState.startedAt = performance.now()
    document.querySelector('#gauge-target').style.left = `${gaugeState.target}%`
    document.querySelector('#gauge-needle').style.left = '50%'
    button.textContent = '팡! 멈추기'
    status.textContent = '초록 구간을 노려요. 시트리가 눈을 가리고 있습니다.'
    gaugeState.frame = requestAnimationFrame(animateGauge)
    return
  }

  gaugeState.running = false
  cancelAnimationFrame(gaugeState.frame)
  const actual = Math.round(54 + (gaugeState.position / 100) * 45)
  const expected = Math.round(54 + (gaugeState.target / 100) * 45)
  const difference = Math.abs(actual - expected)
  research.gaugePlays += 1
  if (difference <= 2) research.precisionHits += 1
  addResearchScore(5 + Math.max(0, 25 - difference))
  submitGameEvent({ type: 'gauge_result', difference })
  const readout = document.querySelector('#gauge-readout')
  readout.textContent = `${actual}°S`
  document.querySelector('#gauge-needle').style.left = `${gaugeState.position}%`
  document.querySelector('#gauge-game').classList.toggle('is-precise', difference <= 4)
  status.textContent = difference <= 2
    ? `완벽 측정! 오차 ${difference}°S. 당도계가 감동해서 영점을 잊었습니다.`
    : difference <= 8
      ? `근접 측정! 오차 ${difference}°S. 시트리가 안대를 벗겼어요.`
      : `오차 ${difference}°S. 차미가 살짝 움직였다고 기록합니다.`
  button.textContent = '한 번 더 측정'
}

function finishFizzRound() {
  clearInterval(fizzState.timer)
  fizzState.running = false
  submitGameEvent({ type: 'mash_result', count: fizzState.count })
  research.mashPlays += 1
  research.bestMashes = Math.max(research.bestMashes, fizzState.count)
  addResearchScore(6 + Math.min(40, fizzState.count))
  document.querySelector('#fizz-button').textContent = '한 판 더 팡팡!'
  document.querySelector('#fizz-status').textContent = fizzState.count >= 18
    ? `${fizzState.count}회! 차미가 팝콘인 줄 알고 줄을 섰어요.`
    : `${fizzState.count}회 팡! 차미는 아직 통통합니다.`
}

function startFizzRound() {
  fizzState.running = true
  fizzState.count = 0
  document.querySelector('#fizz-chami-image').src = randomChamiSprite()
  fizzState.endsAt = Date.now() + 7000
  document.querySelector('#fizz-count').textContent = '0'
  document.querySelector('#fizz-clock').textContent = '7.0'
  document.querySelector('#fizz-timer-fill').style.transform = 'scaleX(1)'
  document.querySelector('#fizz-button').textContent = '팡! 팡! 팡!'
  document.querySelector('#fizz-status').textContent = '7초 동안 버튼을 최대한 많이 눌러요!'
  fizzState.timer = window.setInterval(() => {
    const remaining = Math.max(0, fizzState.endsAt - Date.now())
    document.querySelector('#fizz-clock').textContent = (remaining / 1000).toFixed(1)
    document.querySelector('#fizz-timer-fill').style.transform = `scaleX(${remaining / 7000})`
    if (remaining === 0) finishFizzRound()
  }, 50)
}

function tapFizzButton() {
  if (!fizzState.running) {
    startFizzRound()
    return
  }
  if (Date.now() >= fizzState.endsAt) {
    finishFizzRound()
    return
  }

  fizzState.count += 1
  document.querySelector('#fizz-count').textContent = fizzState.count
  const button = document.querySelector('#fizz-button')
  button.classList.remove('is-tapping')
  requestAnimationFrame(() => button.classList.add('is-tapping'))
  document.querySelector('#fizz-game').classList.remove('is-wobbling')
  requestAnimationFrame(() => document.querySelector('#fizz-game').classList.add('is-wobbling'))
}

function moveCatchTarget() {
  const arena = document.querySelector('#catch-arena')
  const target = document.querySelector('#catch-target')
  if (!arena || !target) return
  const maxX = Math.max(0, arena.clientWidth - target.offsetWidth)
  const maxY = Math.max(0, arena.clientHeight - target.offsetHeight)
  target.style.left = `${Math.random() * maxX}px`
  target.style.top = `${Math.random() * maxY}px`
}

function finishCatchRound() {
  clearInterval(catchState.timer)
  clearInterval(catchState.mover)
  catchState.running = false
  submitGameEvent({ type: 'catch_result', count: catchState.count })
  research.catchPlays += 1
  research.bestCatches = Math.max(research.bestCatches, catchState.count)
  addResearchScore(6 + Math.min(40, catchState.count * 2))
  document.querySelector('#catch-target').disabled = true
  document.querySelector('#catch-start-button').textContent = '한 판 더!'
  document.querySelector('#catch-status').textContent = `${catchState.count}마리 포착! 차미가 연구소 CCTV 사각지대로 도망갔어요.`
}

function startCatchRound() {
  if (catchState.running) return
  catchState.running = true
  catchState.count = 0
  document.querySelector('#catch-target img').src = randomChamiSprite()
  catchState.endsAt = Date.now() + 10000
  document.querySelector('#catch-count').textContent = '0'
  document.querySelector('#catch-clock').textContent = '10.0'
  document.querySelector('#catch-timer-fill').style.transform = 'scaleX(1)'
  document.querySelector('#catch-target').disabled = false
  document.querySelector('#catch-start-button').textContent = '잡는 중…'
  document.querySelector('#catch-status').textContent = '움직이는 차미를 눌러 포착하세요!'
  moveCatchTarget()
  catchState.mover = window.setInterval(moveCatchTarget, 580)
  catchState.timer = window.setInterval(() => {
    const remaining = Math.max(0, catchState.endsAt - Date.now())
    document.querySelector('#catch-clock').textContent = (remaining / 1000).toFixed(1)
    document.querySelector('#catch-timer-fill').style.transform = `scaleX(${remaining / 10000})`
    if (remaining === 0) finishCatchRound()
  }, 50)
}

function catchChami() {
  if (!catchState.running) return
  if (Date.now() >= catchState.endsAt) {
    finishCatchRound()
    return
  }
  catchState.count += 1
  document.querySelector('#catch-count').textContent = catchState.count
  const target = document.querySelector('#catch-target')
  target.classList.remove('is-caught')
  requestAnimationFrame(() => target.classList.add('is-caught'))
  const arena = document.querySelector('#catch-arena')
  arena.classList.remove('has-catch')
  requestAnimationFrame(() => arena.classList.add('has-catch'))
  const combo = document.querySelector('#catch-combo')
  combo.textContent = catchState.count > 1 ? `${catchState.count} COMBO!` : '잡았다!'
  combo.classList.remove('is-visible')
  requestAnimationFrame(() => combo.classList.add('is-visible'))
  moveCatchTarget()
  if ('vibrate' in navigator) navigator.vibrate(18)
}

function renderMemoryBoard(pangIndices = []) {
  const board = document.querySelector('#memory-board')
  const focusedIndex = document.activeElement instanceof Element
    ? document.activeElement.closest('.memory-card')?.dataset.cardIndex
    : null
  board.innerHTML = memoryState.deck.map((card, index) => {
    const isFaceUp = memoryState.hintReveal || memoryState.open.includes(index) || memoryState.matched.has(card.pair)
    return `<button class="memory-card ${isFaceUp ? 'is-face-up' : ''} ${memoryState.matched.has(card.pair) ? 'is-matched' : ''} ${pangIndices.includes(index) ? 'is-pang' : ''}" type="button" data-card-index="${index}" aria-label="${isFaceUp ? '차미 표본 공개' : `표본 카드 ${index + 1} 뒤집기`}" aria-pressed="${isFaceUp}" ${memoryState.active && !memoryState.locked ? '' : 'disabled'}>
      <span class="memory-card-inner"><span class="memory-card-back" aria-hidden="true"><svg class="asterisk-shape" viewBox="0 0 100 100"><path d="M50 0 60 34 82 12 67 40 100 50 67 60 82 88 60 66 50 100 40 66 18 88 33 60 0 50 33 40 18 12 40 34Z" fill="currentColor"/></svg></span><span class="memory-card-front"><img src="${card.sprite}" alt="" loading="lazy" fetchpriority="low" decoding="async" /></span></span>
    </button>`
  }).join('')
  if (focusedIndex !== null && focusedIndex !== undefined) {
    board.querySelector(`[data-card-index="${focusedIndex}"]`)?.focus({ preventScroll: true })
  }
}

function updateMemoryHintButton() {
  const button = document.querySelector('#memory-hint-button')
  if (!button) return
  button.textContent = `전체 보기 힌트 · ${memoryState.hintsRemaining}회`
  button.disabled = !memoryState.active || memoryState.locked || memoryState.hintsRemaining === 0
}

function useMemoryHint() {
  if (!memoryState.active || memoryState.locked || memoryState.hintsRemaining === 0) return
  memoryState.hintsRemaining -= 1
  memoryState.locked = true
  memoryState.hintReveal = true
  const status = document.querySelector('#memory-status')
  const previousStatus = status.textContent
  status.textContent = '힌트! 2초 동안 카드 위치를 기억해보세요.'
  updateMemoryHintButton()
  renderMemoryBoard()
  memoryState.hintTimer = window.setTimeout(() => {
    memoryState.hintReveal = false
    memoryState.locked = false
    renderMemoryBoard()
    updateMemoryHintButton()
    if (memoryState.active) status.textContent = previousStatus
  }, 2000)
}

function makeMemoryDeck() {
  const pairSprites = shuffle([...new Set(chamiSprites)]).slice(0, 8)
  return shuffle(pairSprites.flatMap((sprite, pair) => [{ sprite, pair }, { sprite, pair }]))
}

function startMemoryGame() {
  window.clearTimeout(memoryState.mismatchTimer)
  window.clearTimeout(memoryState.clockTimer)
  window.clearTimeout(memoryState.hintTimer)
  memoryState = {
    active: true,
    locked: false,
    hintReveal: false,
    hintsRemaining: 3,
    deck: makeMemoryDeck(),
    open: [],
    matched: new Set(),
    moves: 0,
    startedAt: Date.now(),
    mismatchTimer: null,
    clockTimer: null,
    hintTimer: null,
  }
  document.querySelector('#memory-moves').textContent = '0'
  document.querySelector('#memory-clock').textContent = '0'
  document.querySelector('#memory-start-button').textContent = '다시 섞기'
  document.querySelector('#memory-status').textContent = '표본을 뒤집어 같은 차미끼리 짝을 맞춰봐요!'
  document.querySelector('#memory-game').classList.remove('is-memory-complete')
  updateMemoryHintButton()
  renderMemoryBoard()
}

function finishMemoryGame() {
  memoryState.active = false
  window.clearTimeout(memoryState.clockTimer)
  window.clearTimeout(memoryState.hintTimer)
  memoryState.hintReveal = false
  const seconds = Math.max(1, Math.round((Date.now() - memoryState.startedAt) / 1000))
  const isGold = memoryState.moves <= 12 && seconds <= 60
  research.memoryPlays += 1
  research.bestMemoryMoves = research.bestMemoryMoves ? Math.min(research.bestMemoryMoves, memoryState.moves) : memoryState.moves
  if (isGold) research.memoryGolds += 1
  addResearchScore(24 + Math.max(0, 60 - memoryState.moves * 2 - Math.floor(seconds / 5)))
  submitGameEvent({ type: 'memory_result', moves: memoryState.moves, seconds })
  document.querySelector('#memory-game').classList.add('is-memory-complete')
  document.querySelector('#memory-start-button').textContent = '한 판 더 연구하기'
  document.querySelector('#memory-status').textContent = isGold
    ? `${memoryState.moves}수 · ${seconds}초! 빠르게 짝을 찾았어요!`
    : memoryState.moves <= 16
      ? `${memoryState.moves}수 · ${seconds}초! 눈썰미가 좋네요.`
      : `${memoryState.moves}수 · ${seconds}초 만에 완주했어요! 다음엔 더 적은 수에 도전해봐요.`
  updateMemoryHintButton()
}

function selectMemoryCard(event) {
  if (!(event.target instanceof Element)) return
  const card = event.target.closest('.memory-card')
  if (!card || !memoryState.active || memoryState.locked) return
  const index = Number(card.dataset.cardIndex)
  const item = memoryState.deck[index]
  if (!item || memoryState.open.includes(index) || memoryState.matched.has(item.pair)) return
  memoryState.open.push(index)
  renderMemoryBoard([index])
  if (memoryState.open.length < 2) return

  memoryState.moves += 1
  document.querySelector('#memory-moves').textContent = memoryState.moves
  const [firstIndex, secondIndex] = memoryState.open
  const first = memoryState.deck[firstIndex]
  const second = memoryState.deck[secondIndex]
  if (first.pair === second.pair) {
    memoryState.matched.add(first.pair)
    memoryState.open = []
    renderMemoryBoard()
    document.querySelector('#memory-status').textContent = `짝을 찾았어요! ${memoryState.matched.size} / 8쌍 발견`
    if (memoryState.matched.size === 8) finishMemoryGame()
    return
  }

  memoryState.locked = true
  updateMemoryHintButton()
  document.querySelector('#memory-status').textContent = '다른 표본이에요. 위치를 기억해두세요!'
  memoryState.mismatchTimer = window.setTimeout(() => {
    memoryState.open = []
    memoryState.locked = false
    renderMemoryBoard()
    updateMemoryHintButton()
  }, 720)
}

function tickMemoryClock() {
  if (!memoryState.active) return
  document.querySelector('#memory-clock').textContent = Math.floor((Date.now() - memoryState.startedAt) / 1000)
  memoryState.clockTimer = window.setTimeout(tickMemoryClock, 250)
}

function finishMoleRound() {
  if (!moleState.running) return
  moleState.running = false
  clearInterval(moleState.timer)
  clearInterval(moleState.mover)
  const score = moleState.hits * 3 + moleState.bestCombo * 2
  research.molePlays += 1
  addResearchScore(score)
  document.querySelectorAll('.mole-hole').forEach((hole) => hole.classList.remove('has-chami'))
  document.querySelector('#mole-start-button').textContent = '다시 팡팡!'
  document.querySelector('#mole-status').textContent = `${moleState.hits}마리 포착! 차미가 땅속 연구실로 돌아갔어요.`
}

function showMoleTarget() {
  const holes = [...document.querySelectorAll('.mole-hole')]
  holes.forEach((hole) => { hole.classList.remove('has-chami', 'is-mole-hit'); hole.disabled = !moleState.running })
  if (!moleState.running) return
  moleState.target = Math.floor(Math.random() * holes.length)
  const target = holes[moleState.target]
  target.querySelector('img').src = randomChamiSprite()
  target.classList.add('has-chami')
}

function startMoleRound() {
  if (moleState.running) return
  moleState = { running: true, hits: 0, combo: 0, bestCombo: 0, endsAt: Date.now() + 15000, timer: null, mover: null, target: -1 }
  document.querySelector('#mole-count').textContent = '0'
  document.querySelector('#mole-clock').textContent = '15.0'
  document.querySelector('#mole-timer-fill').style.transform = 'scaleX(1)'
  document.querySelector('#mole-start-button').textContent = '팡팡 잡는 중…'
  document.querySelector('#mole-status').textContent = '차미가 나타나는 구멍을 빠르게 눌러요!'
  showMoleTarget()
  moleState.mover = window.setInterval(showMoleTarget, 760)
  moleState.timer = window.setInterval(() => {
    const remain = Math.max(0, moleState.endsAt - Date.now())
    document.querySelector('#mole-clock').textContent = (remain / 1000).toFixed(1)
    document.querySelector('#mole-timer-fill').style.transform = `scaleX(${remain / 15000})`
    if (!remain) finishMoleRound()
  }, 50)
}

function hitMole(event) {
  const hole = event.target.closest('.mole-hole')
  if (!moleState.running || !hole || Number(hole.dataset.hole) !== moleState.target) {
    moleState.combo = 0
    return
  }
  moleState.hits += 1
  moleState.combo += 1
  moleState.bestCombo = Math.max(moleState.bestCombo, moleState.combo)
  document.querySelector('#mole-count').textContent = moleState.hits
  document.querySelector('#mole-status').textContent = moleState.combo > 1 ? `${moleState.combo}연속 포착!` : '잡았다! 다음 차미를 찾아요.'
  showMoleTarget()
  hole.classList.remove('is-mole-hit')
  void hole.offsetWidth
  hole.classList.add('is-mole-hit')
}

function nextRadarPrompt() {
  const names = ['chami-sleepy', 'chami-surprised', 'chami-cheerful', 'chami-grumpy', 'chami-curious', 'chami-bashful', 'chami-dizzy', 'chami-yawning']
  const labels = { 'chami-sleepy': '졸린', 'chami-surprised': '놀란', 'chami-cheerful': '신난', 'chami-grumpy': '새침한', 'chami-curious': '궁금한', 'chami-bashful': '수줍은', 'chami-dizzy': '어질어질한', 'chami-yawning': '하품하는' }
  radarState.target = names[Math.floor(Math.random() * names.length)]
  document.querySelector('#radar-prompt').textContent = `${labels[radarState.target]} 차미를 찾아요!`
  const options = shuffle([radarState.target, ...shuffle(names.filter((name) => name !== radarState.target)).slice(0, 5)])
  document.querySelector('#radar-options').innerHTML = options.map((name) => `<button class="radar-option" type="button" data-expression="${name}" aria-label="차미 표정 고르기" ${radarState.running ? '' : 'disabled'}><img src="/images/variants/chami/${name}.png" alt="" loading="lazy" decoding="async"></button>`).join('')
}

function finishRadarRound() {
  if (!radarState.running) return
  radarState.running = false
  clearInterval(radarState.timer)
  clearTimeout(radarState.feedbackTimer)
  document.querySelector('#radar-game').classList.remove('is-radar-correct', 'is-radar-wrong')
  research.radarPlays += 1
  addResearchScore(radarState.correct * 5 + Math.max(0, radarState.rounds - radarState.correct) * 1)
  document.querySelector('#radar-start-button').textContent = '다시 관찰하기'
  document.querySelector('#radar-status').textContent = `${radarState.rounds}번 관찰해 ${radarState.correct}번 찾았어요.`
  nextRadarPrompt()
}

function startRadarRound() {
  if (radarState.running) return
  clearTimeout(radarState.feedbackTimer)
  document.querySelector('#radar-game').classList.remove('is-radar-correct', 'is-radar-wrong')
  radarState = { ...radarState, running: true, correct: 0, rounds: 0, endsAt: Date.now() + 20000, timer: null, feedbackTimer: null }
  document.querySelector('#radar-correct').textContent = '0'
  document.querySelector('#radar-clock').textContent = '20.0'
  document.querySelector('#radar-timer-fill').style.transform = 'scaleX(1)'
  document.querySelector('#radar-start-button').textContent = '관찰 진행 중'
  document.querySelector('#radar-status').textContent = '표정을 살펴보고 알맞은 차미를 골라요.'
  document.querySelectorAll('#radar-options .radar-option').forEach((option) => { option.disabled = false })
  radarState.timer = window.setInterval(() => {
    const remain = Math.max(0, radarState.endsAt - Date.now())
    document.querySelector('#radar-clock').textContent = (remain / 1000).toFixed(1)
    document.querySelector('#radar-timer-fill').style.transform = `scaleX(${remain / 20000})`
    if (!remain) finishRadarRound()
  }, 50)
}

function chooseRadarExpression(event) {
  const option = event.target.closest('.radar-option')
  if (!radarState.running || !option) return
  radarState.rounds += 1
  const correct = option.dataset.expression === radarState.target
  const game = document.querySelector('#radar-game')
  game.classList.remove('is-radar-correct', 'is-radar-wrong')
  void game.offsetWidth
  game.classList.add(correct ? 'is-radar-correct' : 'is-radar-wrong')
  option.classList.add(correct ? 'is-correct' : 'is-wrong')
  document.querySelectorAll('#radar-options .radar-option').forEach((button) => { button.disabled = true })
  if (correct) {
    radarState.correct += 1
    document.querySelector('#radar-correct').textContent = radarState.correct
    document.querySelector('#radar-status').textContent = '정답이에요! 다음 표정을 찾아봐요.'
  } else document.querySelector('#radar-status').textContent = '다른 표정이에요. 다음 차미를 관찰해봐요.'
  radarState.feedbackTimer = window.setTimeout(() => {
    game.classList.remove('is-radar-correct', 'is-radar-wrong')
    if (radarState.running) nextRadarPrompt()
  }, 420)
}

function renderTower() {
  const tower = document.querySelector('#tower-stack')
  tower.innerHTML = Array.from({ length: towerState.height }, (_, index) => `<i class="tower-block ${index === towerState.height - 1 ? 'just-landed' : ''}" style="--block:${index};--block-width:${Math.max(8, towerState.width)}%"><img src="${index === towerState.height - 1 ? randomChamiSprite() : '/images/variants/chami/chami-cheerful.png'}" alt="" loading="lazy" decoding="async"></i>`).join('')
  document.querySelector('#tower-height').textContent = towerState.height
}

function animateTower(timestamp) {
  if (!towerState.running) return
  const elapsed = Math.min(40, timestamp - (towerState.lastFrame || timestamp))
  towerState.lastFrame = timestamp
  towerState.position += towerState.direction * towerState.speed * elapsed
  if (towerState.position > 100 - towerState.width || towerState.position < 0) towerState.direction *= -1
  document.querySelector('#tower-moving').style.left = `${towerState.position}%`
  towerState.frame = requestAnimationFrame(animateTower)
}

function startTower() {
  towerState.running = true
  towerState.height = 0
  towerState.width = 34
  towerState.position = 0
  towerState.direction = 1
  towerState.speed = 0.055
  towerState.lastFrame = 0
  document.querySelector('#tower-status').textContent = '움직이는 설탕 블록을 차미 탑 위에 맞춰 쌓아요.'
  document.querySelector('#tower-start-button').textContent = '게임 진행 중'
  document.querySelector('#tower-start-button').disabled = true
  document.querySelector('#tower-drop-button').disabled = false
  document.querySelector('#tower-moving').style.width = '34%'
  document.querySelector('#tower-moving').style.left = '0%'
  renderTower()
  towerState.frame = requestAnimationFrame(animateTower)
}

function placeTowerBlock() {
  if (!towerState.running) return
  const left = towerState.position
  const overlap = Math.max(0, Math.min(left + towerState.width, 50 + towerState.width / 2) - Math.max(left, 50 - towerState.width / 2))
  if (overlap < 7) {
    towerState.running = false
    cancelAnimationFrame(towerState.frame)
    research.towerPlays += 1
    addResearchScore(towerState.height * 8)
    document.querySelector('#tower-status').textContent = `${towerState.height}층까지 쌓았어요! 탑이 포근하게 착지했어요.`
    document.querySelector('#tower-start-button').textContent = '새 탑 쌓기'
    document.querySelector('#tower-start-button').disabled = false
    document.querySelector('#tower-drop-button').disabled = true
    return
  }
  towerState.height += 1
  towerState.width = Math.min(towerState.width, overlap)
  towerState.position = 50 - towerState.width / 2
  towerState.direction = Math.random() > .5 ? 1 : -1
  towerState.speed = Math.min(.12, towerState.speed + .008)
  document.querySelector('#tower-moving').style.width = `${towerState.width}%`
  renderTower()
  document.querySelector('#tower-status').textContent = `${towerState.height}층! 움직이는 블록이 천천히 이동 중이에요. 맞춰 쌓으려면 ‘블록 놓기’를 누르세요.`
}

function finishPingpong() {
  if (!pingpongState.active) return
  pingpongState.active = false
  cancelAnimationFrame(pingpongState.frame)
  research.pingpongPlays += 1
  addResearchScore(pingpongState.hits * 5)
  saveResearch()
  document.querySelector('#pingpong-start-button').disabled = false
  document.querySelector('#pingpong-start-button').textContent = '다시 도전하기'
  document.querySelector('#pingpong-status').textContent = `공을 ${pingpongState.hits}번 받아쳤어요. 다음 랠리에 도전해봐요!`
}

function animatePingpong(timestamp) {
  if (!pingpongState.active) return
  const elapsed = Math.min(32, timestamp - (pingpongState.lastFrame || timestamp))
  pingpongState.lastFrame = timestamp
  pingpongState.x += pingpongState.vx * elapsed
  pingpongState.y += pingpongState.vy * elapsed
  if (pingpongState.x < 3 || pingpongState.x > 97) {
    pingpongState.x = Math.max(3, Math.min(97, pingpongState.x))
    pingpongState.vx *= -1
  }
  if (pingpongState.y < 4) {
    pingpongState.y = 4
    pingpongState.vy = Math.abs(pingpongState.vy)
  }
  if (pingpongState.vy > 0 && pingpongState.y >= 86) {
    if (Math.abs(pingpongState.x - pingpongState.paddleX) <= 14) {
      pingpongState.hits += 1
      const court = document.querySelector('#pingpong-court')
      court.style.setProperty('--impact-x', `${pingpongState.x}%`)
      court.style.setProperty('--impact-y', `${pingpongState.y}%`)
      court.classList.remove('is-pingpong-hit')
      void court.offsetWidth
      court.classList.add('is-pingpong-hit')
      document.querySelector('#pingpong-hits').textContent = pingpongState.hits
      document.querySelector('#pingpong-status').textContent = `${pingpongState.hits}번 받아쳤어요! 속도 단계 ${pingpongState.hits + 1} · 계속 받아쳐봐요!`
      const offset = (pingpongState.x - pingpongState.paddleX) / 14
      const horizontalVelocity = pingpongState.vx + offset * .005
      pingpongState.vx = Math.sign(horizontalVelocity || pingpongState.vx || 1) * (Math.abs(horizontalVelocity) + .001)
      pingpongState.vy = -(Math.abs(pingpongState.vy) + .003)
      pingpongState.y = 85
    } else {
      finishPingpong()
      return
    }
  }
  const ball = document.querySelector('#pingpong-ball')
  const paddle = document.querySelector('#pingpong-paddle')
  ball.style.left = `${pingpongState.x}%`
  ball.style.top = `${pingpongState.y}%`
  paddle.style.left = `${pingpongState.paddleX}%`
  pingpongState.frame = requestAnimationFrame(animatePingpong)
}

function startPingpong() {
  if (pingpongState.active) return
  pingpongState = { active: true, hits: 0, x: 50, y: 18, vx: Math.random() > .5 ? .018 : -.018, vy: .038, paddleX: 50, frame: null, lastFrame: 0 }
  document.querySelector('#pingpong-hits').textContent = '0'
  document.querySelector('#pingpong-start-button').textContent = '랠리 중…'
  document.querySelector('#pingpong-start-button').disabled = true
  document.querySelector('#pingpong-status').textContent = '포인터를 움직여 차미로 공을 받아요!'
  document.querySelector('#pingpong-ball').style.left = '50%'
  document.querySelector('#pingpong-ball').style.top = '18%'
  document.querySelector('#pingpong-paddle').style.left = '50%'
  pingpongState.frame = requestAnimationFrame(animatePingpong)
}

function movePingpongPaddle(event) {
  if (!pingpongState.active) return
  const court = document.querySelector('#pingpong-court').getBoundingClientRect()
  pingpongState.paddleX = Math.max(13, Math.min(87, ((event.clientX - court.left) / court.width) * 100))
  document.querySelector('#pingpong-paddle').style.left = `${pingpongState.paddleX}%`
}

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#top" aria-label="차미 당도 연구소 홈">
      <svg class="brand-mark asterisk-shape" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0 60 34 82 12 67 40 100 50 67 60 82 88 60 66 50 100 40 66 18 88 33 60 0 50 33 40 18 12 40 34Z" fill="currentColor"/></svg>
      <span>차미 당도 연구소<small>SUGAR LAB</small></span>
    </a>
    <nav class="header-nav" aria-label="페이지 메뉴">
      <a href="#lab">당도 연구</a>
      <a href="#mini-games">미니게임</a>
      <a href="#trophy-shelf">트로피</a>
    </nav>
  </header>

  <main id="top">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="kicker"><span></span> 오늘의 연구 대상: 차미</p>
        <h1 id="hero-title">차미의 당도,<br /><em>팡!</em> 하고 알아볼까?</h1>
        <p class="hero-description">시트리와 함께 차미들의 숨겨진 당도를 연구해요.<br />버튼을 눌러 랜덤으로 등장하는 당도왕을 찾아보세요.</p>
        <a class="primary-button" href="#lab">연구실 입장하기 <span aria-hidden="true">↓</span></a>
        <span class="hero-note">※ 차미는 무해하고 말랑합니다. 연구는 살살!</span>
      </div>
      <div class="hero-art" aria-label="차미 연구를 준비하는 시트리">
        <span class="sun-disc" aria-hidden="true"></span>
        <span class="orbit orbit-one" aria-hidden="true"></span>
        <span class="orbit orbit-two" aria-hidden="true"></span>
        <svg class="hero-spark spark-one asterisk-shape" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0 60 34 82 12 67 40 100 50 67 60 82 88 60 66 50 100 40 66 18 88 33 60 0 50 33 40 18 12 40 34Z" fill="currentColor"/></svg>
        <span class="hero-spark spark-two" aria-hidden="true">✦</span>
        <img class="sitri" src="/images/sitri-hero-expanded.png" alt="머리 장식부터 허벅지까지 온전히 보이는 시트리 팬 일러스트" role="button" tabindex="0" aria-label="시트리 클릭하기" loading="eager" fetchpriority="high" decoding="sync" />
        ${mobileHeroLayout.matches ? '' : `<div class="speech-card" aria-label="시트리의 대사"><span class="speech-dot" aria-hidden="true"></span><span class="speech-line">${sitriDialogues[Math.floor(Math.random() * sitriDialogues.length)]}</span><span class="speech-timer" aria-hidden="true"><span class="speech-timer-fill"></span></span></div>`}
        <span class="art-caption">SITRY · SUGAR RESEARCHER</span>
      </div>
      <span class="hero-index" aria-hidden="true">01 <i>—</i> 02</span>
    </section>

    <section class="lab-section" id="lab" aria-labelledby="lab-title">
      <div class="lab-heading">
        <div>
          <p class="kicker"><span></span> SUGAR CHECK / ROUND 01</p>
          <h2 id="lab-title">오늘의 당도 측정</h2>
          <p class="lab-intro">시트리의 당도 측정기가 무작위 차미를 한 명씩 찾아냅니다.</p>
        </div>
        <div class="lab-controls">
          <span class="unit-label">SUGAR UNIT <b>°S</b></span>
        </div>
      </div>
      <div class="pop-action">
        <div class="pop-explainer"><svg class="pop-star asterisk-shape" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0 60 34 82 12 67 40 100 50 67 60 82 88 60 66 50 100 40 66 18 88 33 60 0 50 33 40 18 12 40 34Z" fill="currentColor"/></svg><span><b>당도왕 차미는 요정 시트리 뒤를 따라다녀요.</b><small>차미마다 1~5번 팡팡 눌러 당도를 측정해요.</small></span></div>
        <button class="pop-button" id="pop-button" type="button">
          <span class="pop-title">차미 팡!</span><span class="pop-subtitle">남은 차미 팡팡 <i aria-hidden="true">↗</i></span>
        </button>
      </div>
      <div class="sample-board" id="sample-board"></div>
      <div class="winner-panel" id="winner-panel" hidden aria-live="polite">
        <span class="winner-crown" aria-hidden="true">♛</span>
        <span><b id="winner-title">오늘의 당도왕!</b><small id="winner-copy"></small></span>
        <span class="winner-confetti" aria-hidden="true"><i>✦</i><svg class="asterisk-shape" viewBox="0 0 100 100"><path d="M50 0 60 34 82 12 67 40 100 50 67 60 82 88 60 66 50 100 40 66 18 88 33 60 0 50 33 40 18 12 40 34Z" fill="currentColor"/></svg><i>✦</i></span>
      </div>
      <div class="lab-footer">
        <p id="lab-status" role="status" aria-live="polite">차미마다 필요한 만큼 팡팡 눌러 여섯 표본의 측정을 완료해요.</p>
        <span class="progress-label"><b id="progress-count">0</b> / 06 CHECKED</span>
      </div>
    </section>

    <section class="mini-games-section" id="mini-games" aria-labelledby="mini-games-title">
      <div class="section-heading">
        <div>
          <p class="kicker"><span></span> RESEARCH SIDE QUESTS</p>
          <h2 id="mini-games-title">연구실 쉬는 시간</h2>
          <p>측정이 끝났다고요? 연구원은 쉬는 시간에도 실험합니다.</p>
        </div>
        <span class="section-stamp">SIDE<br />A / B</span>
      </div>
      <div class="mini-game-grid">
        <article class="mini-game-card gauge-game" id="gauge-game">
          <div class="mini-game-topline"><span>02 · 정밀 측정실</span><span class="mini-game-icon" aria-hidden="true">🧪</span></div>
          <h3>당도계 눈금 맞추기</h3>
          <p class="mini-game-copy">목표 구간을 지나가는 바늘을 팡! 멈춰요. 손 떨림은 연구의 일부입니다.</p>
          <div class="gauge-stage">
            <div class="gauge-readout"><span>현재 측정값</span><b id="gauge-readout">—<small>°S</small></b></div>
            <div class="gauge-track" aria-label="당도계 바늘 눈금">
              <span class="gauge-target" id="gauge-target" style="left:50%"><i>목표</i></span>
              <span class="gauge-needle" id="gauge-needle"></span>
            </div>
            <div class="gauge-labels"><span>덜 달다</span><span>너무 달다</span></div>
          </div>
          <button class="mini-game-button" id="gauge-button" type="button">측정 시작</button>
          <p class="mini-game-status" id="gauge-status" role="status" aria-live="polite">초록 구간을 노려서 멈춰보세요.</p>
        </article>

        <article class="mini-game-card fizz-game" id="fizz-game">
          <div class="mini-game-topline"><span>03 · 기포 제거반</span><span class="mini-game-icon" aria-hidden="true">🫧</span></div>
          <h3>차미 기포 빼기</h3>
          <p class="mini-game-copy">차미 안에 기포가 들어갔대요. 7초 동안 팡팡 눌러서 빼주세요!</p>
          <div class="fizz-stage">
            <div class="fizz-chami"><img id="fizz-chami-image" src="${randomChamiSprite()}" alt="" loading="lazy" fetchpriority="low" decoding="async" /><span class="fizz-bubble bubble-one"></span><span class="fizz-bubble bubble-two"></span><span class="fizz-bubble bubble-three"></span></div>
            <div class="fizz-score"><b id="fizz-count">0</b><span>회 팡!</span><small><b id="fizz-clock">7.0</b>초</small></div>
          </div>
          <div class="fizz-timer"><span id="fizz-timer-fill"></span></div>
          <button class="mini-game-button fizz-button" id="fizz-button" type="button">도전 시작</button>
          <p class="mini-game-status" id="fizz-status" role="status" aria-live="polite">7초 동안 버튼을 최대한 많이 눌러요!</p>
        </article>
      </div>
    </section>

    <section class="collection-section" id="trophy-shelf" aria-labelledby="trophy-title">
      <div class="section-heading collection-heading">
        <div>
          <p class="kicker"><span></span> 차미 연구 기록</p>
          <h2 id="trophy-title">트로피</h2>
          <p>브라우저에 저장된 연구 기록을 카드에서 확인해보세요.</p>
        </div>
      </div>
      <button class="view-trophy-button" id="view-trophy-card" type="button"><span aria-hidden="true">✦</span> 시트리 당도 연구카드 보기</button>
      <p class="collection-note">연구 기록은 이 브라우저에 저장돼요. 다른 기기에서는 새 연구 기록으로 시작합니다.</p>
    </section>
  </main>

  <footer class="site-footer"><span>차미 당도 연구소</span><span>작은 차미들의 당도를 연구하는 곳</span><span>Original By Creatorbus Inc.</span><span class="site-credit"><a href="https://vod.sooplive.com/player/209820895" target="_blank" rel="noopener noreferrer">의상 참고 VOD</a> · <a href="https://www.sooplive.com/station/vlupsitry" target="_blank" rel="noopener noreferrer">시트리의 숲 방송국</a> · AI 생성 이미지 포함 · 비영리 팬게임</span></footer>
`

document.querySelector('.mini-game-grid')?.insertAdjacentHTML('beforeend', `
  <article class="mini-game-card catch-game" id="catch-game">
    <div class="mini-game-topline"><span>04 · 도망 차미 포착</span><span class="mini-game-icon" aria-hidden="true">🐇</span></div>
    <h3>차미 잡아라!</h3>
    <p class="mini-game-copy">10초 동안 도망치는 차미를 눌러 포착하세요. 연속으로 잡으면 기록을 남겨요!</p>
    <div class="catch-score"><b id="catch-count">0</b><span>마리 포착</span><small><b id="catch-clock">10.0</b>초 남음</small></div>
    <div class="catch-arena" id="catch-arena" aria-label="움직이는 차미 포착 구역">
      <button class="catch-target" id="catch-target" type="button" aria-label="도망치는 차미 잡기" disabled><img src="${randomChamiSprite()}" alt="차미" loading="lazy" fetchpriority="low" decoding="async" /></button>
      <span class="catch-combo" id="catch-combo" aria-hidden="true">잡았다!</span>
    </div>
    <div class="fizz-timer catch-timer"><span id="catch-timer-fill"></span></div>
    <button class="mini-game-button" id="catch-start-button" type="button">10초 포착 실험 시작</button>
    <p class="mini-game-status" id="catch-status" role="status" aria-live="polite">움직이는 차미를 눌러 포착하세요!</p>
  </article>
  <article class="mini-game-card memory-game" id="memory-game">
    <div class="mini-game-topline"><span>05 · 차미 표본 정리</span><span class="mini-game-icon" aria-hidden="true">🧩</span></div>
    <h3>같은 차미를 찾아라!</h3>
    <p class="mini-game-copy">16장의 표본에서 여덟 쌍을 찾아요. 힌트는 한 판에 3회, 전체를 2초간 보여줘요.</p>
    <div class="memory-score"><b id="memory-moves">0</b><span>뒤집은 횟수</span><small><b id="memory-clock">0</b>초</small></div>
    <div class="memory-board" id="memory-board" aria-label="차미 표본 짝맞추기 카드"></div>
    <button class="memory-hint-button" id="memory-hint-button" type="button" disabled>전체 보기 힌트 · 3회</button>
    <button class="mini-game-button" id="memory-start-button" type="button">표본 연구 시작</button>
    <p class="mini-game-status" id="memory-status" role="status" aria-live="polite">8쌍의 표본을 찾아보세요.</p>
  </article>
`)
document.querySelector('.mini-game-grid')?.insertAdjacentHTML('beforeend', `
  <article class="mini-game-card mole-game" id="mole-game"><div class="mini-game-topline"><span>06 · 차미 두더지팡</span><span class="mini-game-icon" aria-hidden="true">🔨</span></div><h3>두더지 차미 팡!</h3><p class="mini-game-copy">15초 동안 구멍에서 나오는 차미를 재빨리 눌러요.</p><div class="catch-score"><b id="mole-count">0</b><span>마리 포착</span><small><b id="mole-clock">15.0</b>초</small></div><div class="mole-board">${Array.from({ length: 9 }, (_, index) => `<button class="mole-hole" type="button" data-hole="${index}" aria-label="구멍 ${index + 1}" disabled><img src="${randomChamiSprite()}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div><button class="mini-game-button" id="mole-start-button" type="button">두더지팡 시작</button><p class="mini-game-status" id="mole-status" role="status" aria-live="polite">차미가 나타나면 빠르게 눌러요!</p></article>
  <article class="mini-game-card radar-game" id="radar-game"><div class="mini-game-topline"><span>07 · 표정 레이더</span><span class="mini-game-icon" aria-hidden="true">🔎</span></div><h3>차미 표정 레이더</h3><p class="mini-game-copy">20초 동안 설명에 맞는 표정의 차미를 찾아요.</p><div class="radar-score"><b id="radar-correct">0</b><span>정답</span><small><b id="radar-clock">20.0</b>초</small></div><strong class="radar-prompt" id="radar-prompt">시작하면 표정이 나타나요.</strong><div class="radar-options" id="radar-options"></div><button class="mini-game-button" id="radar-start-button" type="button">표정 관찰 시작</button><p class="mini-game-status" id="radar-status" role="status" aria-live="polite">설명을 읽고 알맞은 표정을 골라봐요.</p></article>
  <article class="mini-game-card tower-game" id="tower-game"><div class="mini-game-topline"><span>08 · 차미 균형탑</span><span class="mini-game-icon" aria-hidden="true">🧱</span></div><h3>설탕 균형탑</h3><p class="mini-game-copy">게임을 시작한 뒤, 천천히 움직이는 블록을 맞춰 놓아요.</p><div class="catch-score"><b id="tower-height">0</b><span>층</span></div><div class="tower-board"><div id="tower-stack" class="tower-stack"></div><i class="tower-foundation" aria-hidden="true"></i><i id="tower-moving" class="tower-moving"></i></div><div class="tower-actions"><button class="mini-game-button" id="tower-start-button" type="button">게임 시작</button><button class="mini-game-button tower-drop-button" id="tower-drop-button" type="button" disabled>블록 놓기</button></div><p class="mini-game-status" id="tower-status" role="status" aria-live="polite">게임 시작을 누르면 움직임이 시작돼요.</p></article>
  <article class="mini-game-card pingpong-game" id="pingpong-game"><div class="mini-game-topline"><span>09 · 차미 핑퐁</span><span class="mini-game-icon" aria-hidden="true">🏓</span></div><h3>차미 핑퐁</h3><p class="mini-game-copy">포인터를 움직여 차미로 공을 받아쳐요. 한 번 놓치면 끝!</p><div class="catch-score"><b id="pingpong-hits">0</b><span>번 받아침</span></div><div class="pingpong-court" id="pingpong-court" aria-label="차미 핑퐁 경기장"><span class="pingpong-center-line" aria-hidden="true"></span><i class="pingpong-ball" id="pingpong-ball" aria-hidden="true"></i><img class="pingpong-paddle" id="pingpong-paddle" src="/images/variants/chami/chami-cheerful.png" alt="차미 패들"></div><button class="mini-game-button" id="pingpong-start-button" type="button">핑퐁 시작</button><p class="mini-game-status" id="pingpong-status" role="status" aria-live="polite">시작 버튼을 누르고 공을 받아쳐요!</p></article>
`)
document.querySelector('#mole-clock').closest('.catch-score').insertAdjacentHTML('afterend', '<div class="fizz-timer game-countdown" aria-hidden="true"><span id="mole-timer-fill"></span></div>')
document.querySelector('#radar-clock').closest('.radar-score').insertAdjacentHTML('afterend', '<div class="fizz-timer game-countdown" aria-hidden="true"><span id="radar-timer-fill"></span></div>')
nextRadarPrompt()
document.body.insertAdjacentHTML('beforeend', `
  <nav class="quick-dock" aria-label="빠른 게임 메뉴">
    <a href="#lab" aria-label="당도 연구실"><span aria-hidden="true">🧪</span><span class="dock-label-wide">당도 연구</span><span class="dock-label-short">연구</span></a>
    <a href="#mini-games" aria-label="미니게임"><span aria-hidden="true">🎮</span><span class="dock-label-wide">미니게임</span><span class="dock-label-short">미니</span></a>
    <a href="#trophy-shelf" aria-label="트로피"><span aria-hidden="true">🏆</span><span class="dock-label-wide">트로피</span><span class="dock-label-short">트로피</span></a>
    <button id="floating-sitri-toggle" type="button" aria-pressed="true" aria-label="시트리 요정 끄기"><span aria-hidden="true">🧚</span><span class="sitri-toggle-wide">시트리 요정 켜짐</span><span class="sitri-toggle-short">요정 켜짐</span></button>
    <button class="guideline-open-button" id="guidelines-open" type="button" aria-haspopup="dialog"><span aria-hidden="true">ⓘ</span><span class="guideline-button-wide">이용 가이드</span><span class="guideline-button-short">안내</span></button>
  </nav>
`)

document.body.insertAdjacentHTML('beforeend', `
  <dialog class="guidelines-dialog" id="guidelines-dialog" aria-labelledby="guidelines-title">
    <header class="guidelines-header">
      <div><p class="kicker"><span></span> FAN GAME / USE GUIDE</p><h2 id="guidelines-title">V-LUP 팬게임 이용 가이드</h2><p>제작·공개·배포 전에 원문 지침을 꼭 확인해주세요.</p></div>
      <button class="guidelines-close" id="guidelines-close" type="button" aria-label="이용 가이드 닫기">✕</button>
    </header>
    <div class="guidelines-content">
      <aside class="guideline-alert"><b>먼저 확인해주세요</b><p>이 작품은 비영리 팬게임을 목표로 제작되었습니다. 공개 전 사전 통보가 필요하며, 배포 채널은 브이럽 공식 카페로 한정됩니다. 이 안내를 표시하는 것만으로 허가·승인 또는 지침 준수가 확정되는 것은 아닙니다. 현재 공개 방식이 지침에 맞는지 제작자가 원문과 함께 확인해야 합니다.</p></aside>
      <section class="guideline-section"><h3>목적과 적용 범위</h3><p>이 지침은 ㈜크리에이터버스 IP를 활용한 비영리 팬게임의 제작·배포에 적용됩니다. 브이럽 2차 창작 가이드라인과 커뮤니티 규정도 함께 준수해야 합니다. 제작·배포 과정에서 발생하는 기술 문제, 버그, 저작권 분쟁, 이용자 피해 등은 제작자 책임이며 ㈜크리에이터버스는 법적·금전적 책임을 지지 않습니다.</p></section>
      <section class="guideline-section"><h3>비영리 원칙과 금지 항목</h3><p>팬게임은 원칙적으로 비영리로만 제작·배포할 수 있습니다. 판매, 유료 다운로드, 인앱 결제·DLC, 유료 베타, 후원·구독 리워드, 스폰서 표기, 제휴 배너, 링크 단축 광고, 광고 수익이 발생하는 호스팅·배포 페이지 이용은 금지됩니다.</p><p>영리 이용은 사전에 ㈜크리에이터버스의 서면 허가를 받아야 하며 IP 사용료가 부과될 수 있습니다. 허가 없는 영리 이용은 불가합니다.</p></section>
      <section class="guideline-section"><h3>저작권 표기와 원저작물 재배포 금지</h3><p>게임 내 크레딧과 배포 페이지 설명란에 아래 표기 및 실제 사용한 원곡·원본 콘텐츠의 공식 링크를 기재해야 합니다.</p><pre class="guideline-credit">Original By Creatorbus Inc.

의상 참고 VOD: https://vod.sooplive.com/player/209820895
시트리의 숲 방송국: https://www.sooplive.com/station/vlupsitry
원곡·원본 콘텐츠의 공식 링크: 배포 시 실제 사용한 공식 콘텐츠 URL 추가 기재</pre><p>시트리 일러스트는 AI 생성 팬 일러스트이며, 의상 참고 출처로 위 방송 VOD를 표기합니다. 고해상도 원화·포토카드 원본·음원 원본 파일을 추출하거나 별도 배포할 수 없습니다. 원저작물을 사실상 그대로 복제해 제공하는 형태도 금지됩니다.</p></section>
      <section class="guideline-section"><h3>콘텐츠 제한</h3><p>타인 비방, 선정성, 정치·종교·사상 풍자, 반사회적 표현, 스트리머 사생활 침해·추적·사칭 등 당사 규정을 위반하는 내용은 사용할 수 없습니다.</p></section>
      <section class="guideline-section"><h3>AI 생성물과 음성 합성</h3><p>AI 생성물은 AI 생성물임을 표시해야 하며, 당사 저작물을 학습 데이터로 사용해서는 안 됩니다. 아래 O/X 표에 이 사이트에서 실제 사용한 AI 기능을 표시했습니다. 시트리와 차미 캐릭터 및 공식 IP의 권리는 각 권리자에게 있으며 이 팬게임이 권리를 주장하지 않습니다.</p><p>음성 합성은 이주인, 시트리, 노이, 리미, 라즈에 한해 비영리 목적으로 허용됩니다. 벨디르 미스틸테인, 이아나 이그노시스, 베루의 음성 합성은 허용되지 않습니다. 허용 범위의 음성 합성도 당사 요청 시 즉시 중단해야 합니다.</p></section>
      <section class="guideline-section ai-disclosure" aria-labelledby="ai-disclosure-title">
        <h3 id="ai-disclosure-title">이 사이트의 AI 사용 내역 O/X</h3>
        <p class="ai-disclosure-intro">O는 실제 사용, X는 사용하지 않음을 뜻합니다. 공식 캐릭터를 참고해 새로 생성한 팬 이미지이며, 공식 원화 파일을 그대로 사이트 에셋으로 쓰지 않습니다.</p>
        <div class="ai-disclosure-list">
          <article class="ai-disclosure-row is-used"><span class="ai-mark">O · 사용</span><div><b>시트리 이미지 생성</b><p>메인 시트리 일러스트와 SD 포즈 이미지를 AI 이미지 생성으로 제작했습니다. 메인 의상은 <a href="https://vod.sooplive.com/player/209820895" target="_blank" rel="noopener noreferrer">참고 VOD</a>의 시트리 의상을 참고했습니다. 원본 방송 캡처를 복사한 이미지는 사용하지 않습니다.</p></div></article>
          <article class="ai-disclosure-row is-used"><span class="ai-mark">O · 사용</span><div><b>차미 이미지 생성</b><p>공식 캐릭터의 둥근 몸, 잎 장식 등 특징을 참고해 표정·잎 형태 변형 이미지를 새로 생성했습니다. 생성된 표본 이미지는 당도왕 차미가 시트리 뒤를 따라가는 작은 위성 캐릭터로도 사용합니다. AI가 스스로 해석한 별도의 그림체로 표현했습니다.</p></div></article>
          <article class="ai-disclosure-row is-used"><span class="ai-mark">O · 사용</span><div><b>문구·기획·코드 AI 보조</b><p>사이트 문구와 대사, 기획·프런트엔드 코드 작성에 AI를 보조 도구로 사용했습니다. 실제 게임 동작과 팡 이펙트는 JavaScript와 CSS로 실행하며, 무작위 선택은 코드의 난수 기능을 사용합니다.</p></div></article>
          <article class="ai-disclosure-row is-unused"><span class="ai-mark">X · 미사용</span><div><b>음성·음악·효과음 생성</b><p>음성 합성, 캐릭터 음성 변환, AI 음악·BGM 및 AI 효과음 생성은 사용하지 않았습니다. 현재 사이트에는 음성·음악 재생 기능이 없습니다.</p></div></article>
          <article class="ai-disclosure-row is-unused"><span class="ai-mark">X · 미사용</span><div><b>영상 생성·모델 학습</b><p>AI 영상 생성은 사용하지 않았습니다. 이 프로젝트에서 공식 자료를 이용한 자체 모델 학습이나 파인튜닝도 하지 않았습니다. 이미지 생성 시 캐릭터와 의상 특징을 참고 입력으로 사용한 것과 모델 학습은 구분됩니다.</p></div></article>
          <article class="ai-disclosure-row is-unused"><span class="ai-mark">X · 미사용</span><div><b>이미지 가공·웹 효과의 생성형 AI 사용</b><p>생성된 이미지를 웹용 크기로 줄이고, 파비콘을 만드는 작업은 코드로 처리했습니다. 9종 게임 결과의 누적 점수와 5단계 트로피 등급은 브라우저 로컬 기록과 코드 규칙으로 계산합니다. 새 두더지팡·표정 레이더·균형탑·차미 핑퐁의 동작과 게임 이펙트도 JavaScript와 CSS로 구현했으며 생성형 AI를 사용하지 않았습니다.</p></div></article>
        </div>
        <p class="ai-name-note">사이트에서는 캐릭터 이름을 시트리와 차미로 표기합니다. 차미에는 별도의 공식 영문 키워드가 없어 영문 이름 표기를 사용하지 않습니다.</p>
        <p class="ai-source-links"><b>이미지 참고 출처:</b> <a href="https://vod.sooplive.com/player/209820895" target="_blank" rel="noopener noreferrer">SITRY 의상 참고 VOD ↗</a> · <a href="https://www.sooplive.com/station/vlupsitry" target="_blank" rel="noopener noreferrer">시트리의 숲 공식 방송국 ↗</a></p>
      </section>
      <section class="guideline-section"><h3>배포 채널과 공개 전 사전 통보</h3><p>배포는 브이럽 공식 카페에서만 가능합니다. 스팀, 앱스토어·구글 플레이, 광고·후원 기능이 기본 제공되는 플랫폼에는 업로드할 수 없습니다. 베타를 포함해 공개하기 전에 배포 링크와 간단한 설명을 당사에 통보해야 합니다. 필요하면 수정 요청 또는 배포 보류 안내가 있을 수 있습니다.</p></section>
      <section class="guideline-section"><h3>위반 시 조치와 문의</h3><p>지침 위반이 확인되면 배포 중단·삭제를 요구할 수 있으며, 필요하면 법적 조치를 진행할 수 있습니다.</p><p>문의: <a href="mailto:v_lup@creatorbus.net">v_lup@creatorbus.net</a> 또는 브이럽 공식 문의 채널</p></section>
      <footer class="guidelines-source"><span>원문 확인</span><a href="https://cafe.naver.com/vlup/36148" target="_blank" rel="noopener noreferrer">팬게임 가이드라인 (PLAY the V-LUP) ↗</a><a href="https://v-lup.com/" target="_blank" rel="noopener noreferrer">V-LUP 공식 사이트 ↗</a></footer>
    </div>
  </dialog>
`)

const guidelinesDialog = document.querySelector('#guidelines-dialog')
document.querySelector('#guidelines-open').addEventListener('click', () => guidelinesDialog.showModal())
document.querySelector('#guidelines-close').addEventListener('click', () => guidelinesDialog.close())
guidelinesDialog.addEventListener('click', (event) => {
  if (event.target === guidelinesDialog) guidelinesDialog.close()
})
document.body.insertAdjacentHTML('beforeend', `
  <dialog class="trophy-card-dialog" id="trophy-card-dialog" aria-labelledby="trophy-card-title">
    <article class="trophy-showcase" id="trophy-showcase">
      <button class="trophy-showcase-close" id="trophy-showcase-close" type="button" aria-label="연구카드 닫기">✕</button>
      <section class="trophy-showcase-art" aria-label="시트리 AI 생성 팬 일러스트">
        <img src="/images/sitri-hero-expanded.png" alt="시트리 AI 생성 팬 일러스트" loading="lazy" fetchpriority="low" decoding="async" />
        <span class="trophy-art-label">SITRY · SUGAR RESEARCHER · AI FAN ART</span>
      </section>
      <section class="trophy-showcase-info">
        <p class="kicker"><span></span> SUGAR LAB · RESEARCH FILE</p>
        <h2 id="trophy-card-title">시트리 당도 연구카드</h2>
        <p class="trophy-showcase-subtitle">이 브라우저에 저장된 연구 기록</p>
        <div class="trophy-showcase-stats" id="trophy-showcase-stats"></div>
        <div class="single-trophy trophy-modal-item" id="trophy-rank-card" data-tier="research" aria-label="현재 트로피 등급">
          <span id="trophy-rank-icon" aria-hidden="true">🏆</span>
          <div><small>현재 등급</small><b id="trophy-tier-name">연구 중</b><strong id="trophy-total-score">총 0점</strong></div>
        </div>
      </section>
    </article>
  </dialog>
`)
document.body.insertAdjacentHTML('beforeend', `
  <div class="chami-satellites is-disabled" id="chami-satellites" aria-hidden="true"></div>
  <aside class="floating-sitri" id="floating-sitri" aria-label="시트리의 한마디">
    <div class="floating-sitri-bubble"><span class="speech-dot" aria-hidden="true"></span><span id="floating-sitri-line"></span></div>
    <img id="floating-sitri-image" src="/images/variants/sitri/sitri-wave-mascot.png" alt="시트리 SD 캐릭터" loading="lazy" fetchpriority="low" decoding="async" />
  </aside>
`)

const floatingSitri = document.querySelector('#floating-sitri')
const floatingSitriImage = document.querySelector('#floating-sitri-image')
const floatingSitriLine = document.querySelector('#floating-sitri-line')
const chamiSatellitesLayer = document.querySelector('#chami-satellites')
const floatingSitriToggle = document.querySelector('#floating-sitri-toggle')
const sitriPoses = ['sitri-wave-mascot', 'sitri-pointing-mascot', 'sitri-trophy-mascot', 'sitri-sugar-meter-mascot']
let floatingSitriEnabled = true
try {
  floatingSitriEnabled = localStorage.getItem('chami-floating-sitri') !== 'off'
} catch { }
const initialMarginX = Math.min(112, window.innerWidth * 0.28)
const initialMarginY = Math.min(142, window.innerHeight * 0.3)
let floaterX = initialMarginX + Math.random() * Math.max(1, window.innerWidth - initialMarginX * 2)
let floaterY = initialMarginY + Math.random() * Math.max(1, window.innerHeight - initialMarginY * 2)
let targetX = floaterX
let targetY = floaterY
let reactionTimer
let clickChaseUntil = 0
let lastFloaterFrame = 0
let floaterFrame = null
let chamiSatellites = []
let satelliteFrame = null
let lastSatelliteFrame = 0

function setFloatingSitriEnabled(enabled) {
  floatingSitriEnabled = enabled
  floatingSitri.classList.toggle('is-disabled', !enabled)
  chamiSatellitesLayer.classList.toggle('is-disabled', !enabled)
  floatingSitri.setAttribute('aria-hidden', String(!enabled))
  floatingSitriToggle.setAttribute('aria-pressed', String(enabled))
  floatingSitriToggle.setAttribute('aria-label', `시트리 요정 ${enabled ? '끄기' : '켜기'}`)
  floatingSitriToggle.querySelector('.sitri-toggle-wide').textContent = `시트리 요정 ${enabled ? '켜짐' : '꺼짐'}`
  floatingSitriToggle.querySelector('.sitri-toggle-short').textContent = `요정 ${enabled ? '켜짐' : '꺼짐'}`
  if (!enabled && floaterFrame !== null) {
    cancelAnimationFrame(floaterFrame)
    floaterFrame = null
  }
  if (!enabled && satelliteFrame !== null) {
    cancelAnimationFrame(satelliteFrame)
    satelliteFrame = null
  } else if (enabled && chamiSatellites.length) {
    scheduleChamiSatellites()
  }
  try {
    localStorage.setItem('chami-floating-sitri', enabled ? 'on' : 'off')
  } catch { }
}

setFloatingSitriEnabled(floatingSitriEnabled)
floatingSitriToggle.addEventListener('click', () => setFloatingSitriEnabled(!floatingSitriEnabled))

function setFloaterTarget(x, y) {
  if (!floatingSitriEnabled) return
  const marginX = Math.min(112, window.innerWidth * 0.28)
  const marginY = Math.min(142, window.innerHeight * 0.3)
  targetX = Math.max(marginX, Math.min(window.innerWidth - marginX, x))
  targetY = Math.max(marginY, Math.min(window.innerHeight - marginY, y))
  clickChaseUntil = performance.now() + 950
  if (floaterFrame === null) {
    lastFloaterFrame = 0
    floaterFrame = requestAnimationFrame(moveFloaterFrame)
  }
  scheduleChamiSatellites()
}

function setFloaterNearPointer(x, y) {
  const marginX = Math.min(112, window.innerWidth * 0.28)
  const marginY = Math.min(142, window.innerHeight * 0.3)
  const clampX = (value) => Math.max(marginX, Math.min(window.innerWidth - marginX, value))
  const clampY = (value) => Math.max(marginY, Math.min(window.innerHeight - marginY, value))
  const gap = 148
  const candidates = [
    { x, y: y - gap },
    { x, y: y + gap },
    { x: x - gap, y },
    { x: x + gap, y },
  ].map((point) => ({ x: clampX(point.x), y: clampY(point.y) }))
  candidates.sort((a, b) => Math.abs(Math.hypot(a.x - x, a.y - y) - gap) - Math.abs(Math.hypot(b.x - x, b.y - y) - gap))
  setFloaterTarget(candidates[0].x, candidates[0].y)
}

function attachChamiSatellite(sprite) {
  const image = document.createElement('img')
  const index = chamiSatellites.length
  image.className = 'chami-satellite'
  image.src = sprite
  image.alt = ''
  image.setAttribute('aria-hidden', 'true')
  image.loading = 'lazy'
  image.decoding = 'async'
  image.style.setProperty('--satellite-size', `${Math.max(17, 34 - index * 1.1)}px`)
  chamiSatellitesLayer.append(image)
  chamiSatellites.push({ element: image, x: floaterX, y: floaterY })
  scheduleChamiSatellites()
}

function scheduleChamiSatellites() {
  if (!floatingSitriEnabled || !chamiSatellites.length || satelliteFrame !== null) return
  lastSatelliteFrame = 0
  satelliteFrame = requestAnimationFrame(moveChamiSatellites)
}

function moveChamiSatellites(now = performance.now()) {
  satelliteFrame = null
  if (!floatingSitriEnabled || !chamiSatellites.length) return
  const delta = lastSatelliteFrame ? Math.min((now - lastSatelliteFrame) / 1000, 0.05) : 0.016
  lastSatelliteFrame = now
  const easing = 1 - Math.exp(-1.7 * delta)
  let stillFollowing = false
  chamiSatellites.forEach((satellite, index) => {
    const leader = index === 0 ? { x: floaterX, y: floaterY } : chamiSatellites[index - 1]
    const targetX = Math.max(18, Math.min(window.innerWidth - 18, leader.x - (index === 0 ? 34 : 27)))
    const targetY = Math.max(20, Math.min(window.innerHeight - 20, leader.y + (index === 0 ? 48 : 17)))
    satellite.x += (targetX - satellite.x) * easing
    satellite.y += (targetY - satellite.y) * easing
    satellite.element.style.left = `${satellite.x}px`
    satellite.element.style.top = `${satellite.y}px`
    if (Math.hypot(targetX - satellite.x, targetY - satellite.y) > 0.7) stillFollowing = true
  })
  if (stillFollowing) satelliteFrame = requestAnimationFrame(moveChamiSatellites)
  else lastSatelliteFrame = 0
}

function moveFloaterFrame(now = performance.now()) {
  const delta = lastFloaterFrame ? Math.min((now - lastFloaterFrame) / 1000, 0.05) : 0.016
  lastFloaterFrame = now
  const response = now < clickChaseUntil ? 4.2 : 0.62
  const easing = 1 - Math.exp(-response * delta)
  floaterX += (targetX - floaterX) * easing
  floaterY += (targetY - floaterY) * easing
  floatingSitri.style.left = `${floaterX}px`
  floatingSitri.style.top = `${floaterY}px`
  scheduleChamiSatellites()
  if (Math.hypot(targetX - floaterX, targetY - floaterY) < 0.8) {
    floaterX = targetX
    floaterY = targetY
    floatingSitri.style.left = `${floaterX}px`
    floatingSitri.style.top = `${floaterY}px`
    floaterFrame = null
    return
  }
  floaterFrame = requestAnimationFrame(moveFloaterFrame)
}

function sayAsSitri(lines, pose = null) {
  floatingSitriLine.textContent = lines[Math.floor(Math.random() * lines.length)]
  floatingSitriImage.src = `/images/variants/sitri/${pose || sitriPoses[Math.floor(Math.random() * sitriPoses.length)]}.png`
  floatingSitri.classList.remove('is-excited')
  void floatingSitri.offsetWidth
  floatingSitri.classList.add('is-excited')
  window.clearTimeout(reactionTimer)
  reactionTimer = window.setTimeout(() => floatingSitri.classList.remove('is-excited'), 650)
}

function respondToClick(event) {
  const target = event.target instanceof Element ? event.target : null
  if (!floatingSitriEnabled || !target || target.closest('#floating-sitri-toggle')) return
  const inContext = (selector) => Boolean(target.closest(selector))
  const contexts = [
    ['.hero-art .sitri', sitriGameLines.hero, 'sitri-wave-mascot'],
    ['#pop-button, .sample', sitriGameLines.pop, 'sitri-sugar-meter-mascot'],
    ['#gauge-button, #gauge-game', sitriGameLines.gauge, 'sitri-pointing-mascot'],
    ['#fizz-button, #fizz-game', sitriGameLines.fizz, 'sitri-sugar-meter-mascot'],
    ['#catch-start-button, #catch-target, #catch-game', sitriGameLines.catch, 'sitri-wave-mascot'],
    ['#memory-start-button, #memory-board, #memory-game', sitriGameLines.memory, 'sitri-pointing-mascot'],
    ['#mole-game', sitriGameLines.mole, 'sitri-wave-mascot'],
    ['#radar-game', sitriGameLines.radar, 'sitri-pointing-mascot'],
    ['#tower-game', sitriGameLines.tower, 'sitri-sugar-meter-mascot'],
    ['#pingpong-game', sitriGameLines.pingpong, 'sitri-wave-mascot'],
    ['#guidelines-open', sitriGameLines.guideline, 'sitri-pointing-mascot'],
    ['#trophy-shelf, #trophy-card-dialog', sitriGameLines.collection, 'sitri-trophy-mascot'],
    ['#mini-games', sitriGameLines.miniGames, 'sitri-pointing-mascot'],
    ['#lab', sitriGameLines.lab, 'sitri-sugar-meter-mascot'],
  ]
  const context = contexts.find(([selector]) => inContext(selector))
  sayAsSitri(context?.[1] ?? sitriGameLines.default, context?.[2] ?? 'sitri-wave-mascot')

  let pointX = event.clientX
  let pointY = event.clientY
  if (event.detail === 0) {
    const bounds = target.getBoundingClientRect()
    pointX = bounds.left + bounds.width / 2
    pointY = bounds.top + bounds.height / 2
  }
  setFloaterNearPointer(pointX, pointY)
}
floatingSitriImage.src = `/images/variants/sitri/${sitriPoses[Math.floor(Math.random() * sitriPoses.length)]}.png`
floatingSitriLine.textContent = sitriDialogues[Math.floor(Math.random() * sitriDialogues.length)]
floatingSitri.style.left = `${floaterX}px`
floatingSitri.style.top = `${floaterY}px`
document.addEventListener('click', respondToClick)
document.addEventListener('keydown', (event) => {
  if (floatingSitriEnabled && (event.key === 'Enter' || event.key === ' ') && event.target instanceof Element && event.target.matches('.hero-art .sitri')) {
    event.preventDefault()
    sayAsSitri(sitriGameLines.hero, 'sitri-wave-mascot')
    const bounds = event.target.getBoundingClientRect()
    setFloaterTarget(bounds.left + bounds.width * 0.55, bounds.top + bounds.height * 0.55)
  }
})
window.addEventListener('resize', () => setFloaterTarget(targetX, targetY))

samples = makeSamples()
renderSamples()
memoryState.deck = makeMemoryDeck()
renderMemoryBoard()
function bindHeroSpeechTimer() {
  const heroSpeechLine = document.querySelector('.speech-line')
  const heroSpeechTimer = document.querySelector('.speech-timer-fill')
  if (!heroSpeechLine || !heroSpeechTimer) return
  heroSpeechTimer.addEventListener('animationiteration', () => {
    const currentLine = heroSpeechLine.textContent
    const nextLines = sitriDialogues.filter((line) => line !== currentLine)
    const nextLine = nextLines[Math.floor(Math.random() * nextLines.length)]
    heroSpeechLine.classList.add('is-changing')
    window.setTimeout(() => {
      heroSpeechLine.textContent = nextLine
      heroSpeechLine.classList.remove('is-changing')
    }, 180)
  })
}
bindHeroSpeechTimer()
mobileHeroLayout.addEventListener('change', ({ matches }) => {
  const heroArt = document.querySelector('.hero-art')
  const speechCard = heroArt.querySelector('.speech-card')
  if (matches) {
    speechCard?.remove()
    return
  }
  if (speechCard) return
  heroArt.insertAdjacentHTML('beforeend', `<div class="speech-card" aria-label="시트리의 대사"><span class="speech-dot" aria-hidden="true"></span><span class="speech-line">${sitriDialogues[Math.floor(Math.random() * sitriDialogues.length)]}</span><span class="speech-timer" aria-hidden="true"><span class="speech-timer-fill"></span></span></div>`)
  bindHeroSpeechTimer()
})
document.querySelector('#pop-button').addEventListener('click', () => {
  if (samples.every((sample) => sample.revealed)) resetLab()
  else measureRandomSample()
})
document.querySelector('#gauge-button').addEventListener('click', useGauge)
document.querySelector('#fizz-button').addEventListener('click', tapFizzButton)
document.querySelector('#catch-start-button').addEventListener('click', startCatchRound)
document.querySelector('#catch-target').addEventListener('click', catchChami)
document.querySelector('#memory-start-button').addEventListener('click', () => { startMemoryGame(); tickMemoryClock() })
document.querySelector('#memory-board').addEventListener('click', selectMemoryCard)
document.querySelector('#memory-hint-button').addEventListener('click', useMemoryHint)
document.querySelector('#mole-start-button').addEventListener('click', startMoleRound)
document.querySelector('#mole-game').addEventListener('click', hitMole)
document.querySelector('#radar-start-button').addEventListener('click', startRadarRound)
document.querySelector('#radar-options').addEventListener('click', chooseRadarExpression)
document.querySelector('#tower-start-button').addEventListener('click', startTower)
document.querySelector('#tower-drop-button').addEventListener('click', placeTowerBlock)
document.querySelector('#pingpong-start-button').addEventListener('click', startPingpong)
document.querySelector('#pingpong-court').addEventListener('pointermove', movePingpongPaddle)
document.querySelector('#pingpong-court').addEventListener('pointerdown', movePingpongPaddle)
const dockSectionLinks = [...document.querySelectorAll('.quick-dock a[href^="#"]')]
const dockSections = dockSectionLinks
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter(({ section }) => section)
let dockUpdateQueued = false
function updateDockSection() {
  dockUpdateQueued = false
  const activationLine = window.innerHeight * 0.38
  let activeLink = null

  for (const { link, section } of dockSections) {
    if (section.getBoundingClientRect().top <= activationLine) activeLink = link
  }

  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
    activeLink = dockSections[dockSections.length - 1]?.link || activeLink
  }

  for (const { link } of dockSections) {
    const isActive = link === activeLink
    link.classList.toggle('is-active', isActive)
    if (isActive) link.setAttribute('aria-current', 'location')
    else link.removeAttribute('aria-current')
  }
}
function scheduleDockSectionUpdate() {
  if (dockUpdateQueued) return
  dockUpdateQueued = true
  window.requestAnimationFrame(updateDockSection)
}
window.addEventListener('scroll', scheduleDockSectionUpdate, { passive: true })
window.addEventListener('resize', scheduleDockSectionUpdate)
updateDockSection()
const trophyCardDialog = document.querySelector('#trophy-card-dialog')
const trophyShowcase = document.querySelector('#trophy-showcase')
document.querySelector('#view-trophy-card').addEventListener('click', () => {
  document.querySelector('#trophy-showcase-stats').innerHTML = [
    ['완료 연구', research.completedRounds, 'ROUND'],
    ['최고 당도', research.bestSugar || '—', '°S'],
    ['최고 팡팡', research.bestMashes, '회'],
  ].map(([label, value, unit]) => `<div><small>${label}</small><b>${value}<em>${unit}</em></b></div>`).join('')
  const tier = trophyTierForScore(research.totalScore)
  const rankCard = document.querySelector('#trophy-rank-card')
  rankCard.dataset.tier = tier.id
  document.querySelector('#trophy-rank-icon').textContent = tier.icon
  document.querySelector('#trophy-tier-name').textContent = tier.name
  document.querySelector('#trophy-total-score').textContent = `총 ${research.totalScore}점`
  trophyCardDialog.showModal()
})
document.querySelector('#trophy-showcase-close').addEventListener('click', () => trophyCardDialog.close())
trophyCardDialog.addEventListener('click', (event) => {
  if (event.target === trophyCardDialog) trophyCardDialog.close()
})
trophyShowcase.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'mouse') return
  const bounds = trophyShowcase.getBoundingClientRect()
  const x = (event.clientX - bounds.left) / bounds.width - 0.5
  const y = (event.clientY - bounds.top) / bounds.height - 0.5
  trophyShowcase.style.setProperty('--card-tilt-x', `${x * 5}deg`)
  trophyShowcase.style.setProperty('--card-tilt-y', `${y * -5}deg`)
})
trophyShowcase.addEventListener('pointerleave', () => {
  trophyShowcase.style.setProperty('--card-tilt-x', '0deg')
  trophyShowcase.style.setProperty('--card-tilt-y', '0deg')
})
const beginProfileSync = () => {
  if (!profileSyncPromise) profileSyncPromise = syncServerProfile()
}
if ('requestIdleCallback' in window) window.requestIdleCallback(beginProfileSync, { timeout: 2500 })
else window.setTimeout(beginProfileSync, 800)
