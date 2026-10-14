import './style.css'

if (window.matchMedia('(pointer: coarse)').matches) {
  document.addEventListener('dblclick', (event) => event.preventDefault(), { passive: false })
  for (const eventName of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(eventName, (event) => event.preventDefault(), { passive: false })
  }
}

const app = document.querySelector('#app')
const sampleCount = 6
const saveKey = 'chami-sugar-lab-research-v1'
const chamiSprites = [
  'chami-cheerful', 'chami-sleepy', 'chami-determined', 'chami-surprised', 'chami-dozy', 'chami-sparkle',
  'chami-cheering', 'chami-yawning', 'chami-curious', 'chami-bashful', 'chami-grumpy', 'chami-dizzy',
  'chami-triple-leaf', 'chami-curled-leaf', 'chami-double-sprout', 'chami-mint-leaf', 'chami-dew-leaf', 'chami-pear-shape',
].map((name) => `/images/variants/chami/${name}.png`)
const sitriDialogues = [
  '자, 오늘은 어떤 차미가 당도왕일까요?',
  '차미 당도는 제가 꼼꼼히 살펴볼게요.',
  '연구 결과가 궁금하네요. 귀여움도 중요하니까요!',
  '차미야, 오늘도 팡팡 연구에 협조해줘요!',
]
const sitriGameLines = {
  pop: ['차미 팡! 당도를 측정해볼게요!', '이번 당도왕은 누구일까요? 하나씩 확인해봐요!', '팡! 연구 결과가 곧 나와요.'],
  gauge: ['초록 구간에 맞추면 정밀도 보너스예요!', '바늘을 잘 보고 타이밍을 맞춰봐요!', '천천히… 지금 눌러요!'],
  fizz: ['7초 동안 기포를 빠르게 눌러봐요!', '기포가 도망가기 전에 팡팡 눌러요!', '연속 탭이에요! 연구원 손놀림을 보여줘요!'],
  catch: ['도망치는 차미를 눌러 잡아봐요!', '차미가 방향을 바꾸기 전에 잡아야 해요!', '손가락 준비됐나요? 차미가 보여요!'],
  collection: ['트로피가 하나씩 늘고 있네요. 뿌듯해요!', '새 트로피를 모으려면 미니게임도 해봐요!', '연구 기록을 차곡차곡 모아봐요!'],
  guideline: ['이 작품은 팬게임이에요. 이용 안내도 확인해 주세요!', '공개 전에 배포 조건을 확인하는 것, 잊지 마세요!'],
  miniGames: ['어떤 미니게임부터 해볼까요?', '게임마다 연구 보상이 달라요!', '마음에 드는 연구를 골라 도전해봐요!'],
  memory: ['표본 위치를 기억해 짝을 찾아봐요!', '8장 중 짝은 네 쌍이에요. 황금 트로피는 6수·30초 안에 도전해봐요!', '같은 차미도 표정이 다르네요. 차근차근 찾아봐요!'],
  lab: ['차미 당도를 측정하고 있어요!', '여섯 번 팡! 해서 당도왕을 찾아봐요.', '이번 연구 결과가 궁금하네요!'],
  hero: ['앗, 저를 눌러주셨네요!', '여기 있어요! 한 번 더 눌러봐도 좋아요.', '반가워요! 오늘도 차미 연구를 시작해볼까요?'],
  default: ['어, 저를 부르셨나요?', '클릭한 곳까지 후다닥 갈게요!', '여기저기 구경하고 있었어요!'],
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

const trophyCatalog = [
  { id: 'first-round', icon: '🧪', title: '첫 연구', detail: '첫 당도 연구를 마쳤다' },
  { id: 'sweet-95', icon: '🍯', title: '고당도 경보', detail: '95째S 이상 차미를 발견했다' },
  { id: 'sweet-99', icon: '👑', title: '당도 대폭발', detail: '최고 당도 99째S를 기록했다' },
  { id: 'all-sweet', icon: '🍬', title: '전원 달콤', detail: '한 판에서 모두 80째S 이상' },
  { id: 'rounds-5', icon: '📒', title: '성실 연구원', detail: '당도 연구 5회 완료' },
  { id: 'rounds-20', icon: '🏅', title: '차미 박사', detail: '당도 연구 20회 완료' },
  { id: 'precision', icon: '🎯', title: '정밀 측정', detail: '차이 2째S 이내로 측정' },
  { id: 'precision-10', icon: '🧭', title: '영점의 달인', detail: '정밀 측정 10회 성공' },
  { id: 'rapid-paws', icon: '🐾', title: '바쁜 앞발', detail: '거품 게임에서 18회 연타' },
  { id: 'fizz-master', icon: '🫧', title: '거품 과학자', detail: '거품 게임에서 30회 연타' },
  { id: 'mini-game-fan', icon: '🎮', title: '연구소 순회', detail: '다섯 가지 게임을 모두 플레이' },
  { id: 'collection-6', icon: '✨', title: '트로피 수집가', detail: '트로피 6개 수집' },
  { id: 'chami-catcher', icon: '🐇', title: '재빠른 앞발', detail: '도망 차미 5마리 잡기' },
  { id: 'chami-catcher-15', icon: '🧤', title: '수집왕 차미', detail: '도망 차미 15마리 잡기' },
  { id: 'memory-first', icon: '🧩', title: '표본 정리', detail: '차미 표본 짝맞추기 완주' },
  { id: 'memory-analyst', icon: '🔬', title: '눈썰미 연구원', detail: '짝맞추기를 8수 이내로 완주' },
  { id: 'memory-gold', icon: '🌟', title: '황금 기억력', detail: '6수 이하·30초 안에 완주' },
  { id: 'memory-master', icon: '💎', title: '표본 기억의 달인', detail: '황금 기억력 연구 5회 달성' },
  { id: 'lab-legend', icon: '🏆', title: '연구소의 전설', detail: '당도 연구 50회 완료' },
]
const goldTrophyIds = new Set(['sweet-99', 'precision-10', 'chami-catcher-15', 'memory-gold', 'memory-master', 'lab-legend'])
const localBadgeTrophyMap = { 'first-round': 'first-round', 'sugar-overload': 'sweet-95', 'all-sweet': 'all-sweet', 'steady-hand': 'precision', 'rapid-paws': 'rapid-paws', veteran: 'rounds-5', 'memory-first': 'memory-first', 'memory-analyst': 'memory-analyst', 'memory-gold': 'memory-gold', 'memory-master': 'memory-master', 'lab-legend': 'lab-legend' }
const measurementNotes = [
  '당도계가 잠깐 행복해졌습니다.',
  '시트리가 고개를 끄덕였습니다. 근거는 없습니다.',
  '측정기가 설탕을 보고 살짝 눈을 피합니다.',
  '연구소 기준으로 꽤 수상한 수치입니다.',
  '기계가 방금 작은 박수를 친 것 같습니다.',
]
const badgeDefinitions = [
  { id: 'first-round', icon: '🧪', title: '첫 실험', detail: '차미 6개 당도 측정 완료' },
  { id: 'sugar-overload', icon: '🍯', title: '당도 초과', detail: '95°S 이상 차미 발견' },
  { id: 'all-sweet', icon: '✦', title: '끈적한 연구실', detail: '한 판에서 전원 80°S 이상' },
  { id: 'steady-hand', icon: '🎯', title: '정밀 연구원', detail: '눈금 맞추기 오차 2°S 이하' },
  { id: 'rapid-paws', icon: '💨', title: '팡팡 장인', detail: '7초 안에 18번 팡!' },
  { id: 'veteran', icon: '📔', title: '연구소 단골', detail: '당도 연구 5회 완료' },
  { id: 'memory-first', icon: '🧩', title: '표본 정리', detail: '차미 표본 짝맞추기 완주' },
  { id: 'memory-analyst', icon: '🔬', title: '눈썰미 연구원', detail: '짝맞추기를 8수 이내로 완주' },
  { id: 'memory-gold', icon: '🌟', title: '황금 기억력', detail: '6수 이하·30초 안에 완주' },
  { id: 'memory-master', icon: '💎', title: '표본 기억의 달인', detail: '황금 기억력 연구 5회 달성' },
  { id: 'lab-legend', icon: '🏆', title: '연구소의 전설', detail: '당도 연구 50회 완료' },
]
let samples = []
let roundSerial = 0
let gaugeState = { running: false, target: 50, position: 50, startedAt: 0, frame: null }
let fizzState = { running: false, count: 0, endsAt: 0, timer: null }
let catchState = { running: false, count: 0, endsAt: 0, timer: null, mover: null }
let memoryState = { active: false, locked: false, deck: [], open: [], matched: new Set(), moves: 0, startedAt: 0, mismatchTimer: null, clockTimer: null }
let knownTrophies = null
let trophyToastTimer = null
let profileSyncPromise = null
let lastServerProfile = null

function loadResearch() {
  const fresh = { completedRounds: 0, bestSugar: 0, bestMashes: 0, bestCatches: 0, catchPlays: 0, gaugePlays: 0, precisionHits: 0, mashPlays: 0, bestMemoryMoves: 0, memoryPlays: 0, memoryGolds: 0, trophies: [], badges: [] }
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey))
    return { ...fresh, ...saved, badges: Array.isArray(saved?.badges) ? saved.badges : [], trophies: Array.isArray(saved?.trophies) ? saved.trophies : [] }
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

function renderTrophies(definitions = [], earnedTrophies = []) {
  const grid = document.querySelector('#trophy-grid')
  if (!grid) return
  const earned = new Map(earnedTrophies.map((item) => [item.id, item.earnedAt]))
  grid.innerHTML = definitions.map((trophy) => {
    const date = earned.get(trophy.id)
    const rarity = goldTrophyIds.has(trophy.id) ? 'is-gold' : ['sweet-95', 'rounds-20', 'fizz-master', 'mini-game-fan', 'chami-catcher'].includes(trophy.id) ? 'is-silver' : ''
    return `<article class="trophy-card ${date ? 'is-earned' : 'is-locked'} ${rarity}">
      <span class="trophy-icon" aria-hidden="true">${date ? trophy.icon : '🔒'}</span>
      <span class="trophy-name">${trophy.title}</span><small>${trophy.detail}</small>
      <span class="trophy-state">${date ? '달성 완료' : '미달성'}</span>
    </article>`
  }).join('')
  const count = document.querySelector('#trophy-count')
  if (count) count.textContent = String(earned.size)
}

function applyServerProfile(profile) {
  lastServerProfile = profile
  const stats = profile.stats || {}
  const earnedTrophies = profile.trophies || []
  const earned = new Set(earnedTrophies.map((trophy) => trophy.id))
  if (knownTrophies) {
    const newAwards = earnedTrophies.filter((trophy) => !knownTrophies.has(trophy.id))
    if (newAwards.length) showTrophyToast(newAwards[0], profile.trophyDefinitions)
  }
  knownTrophies = earned
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
    trophies: earnedTrophies.map((trophy) => trophy.id),
    badges: [
      earned.has('first-round') && 'first-round',
      earned.has('sweet-95') && 'sugar-overload',
      earned.has('all-sweet') && 'all-sweet',
      earned.has('precision') && 'steady-hand',
      earned.has('rapid-paws') && 'rapid-paws',
      earned.has('rounds-5') && 'veteran',
      earned.has('memory-first') && 'memory-first',
      earned.has('memory-analyst') && 'memory-analyst',
      earned.has('memory-gold') && 'memory-gold',
      earned.has('memory-master') && 'memory-master',
      earned.has('lab-legend') && 'lab-legend',
    ].filter(Boolean),
  }
  saveResearch()
  renderCollection()
  renderTrophies(profile.trophyDefinitions, profile.trophies)
}

function showTrophyToast(award, definitions = []) {
  const trophy = definitions.find((item) => item.id === award.id)
  if (!trophy) return
  document.querySelector('.trophy-toast')?.remove()
  const toast = document.createElement('div')
  toast.className = 'trophy-toast'
  toast.setAttribute('role', 'status')
  const icon = document.createElement('span')
  icon.textContent = trophy.icon
  const copy = document.createElement('span')
  const label = document.createElement('small')
  label.textContent = 'NEW TROPHY!'
  const title = document.createElement('b')
  title.textContent = trophy.title
  copy.append(label, title)
  toast.append(icon, copy)
  document.body.append(toast)
  window.clearTimeout(trophyToastTimer)
  trophyToastTimer = window.setTimeout(() => toast.remove(), 3600)
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

function unlockBadge(id) {
  if (!research.badges.includes(id)) {
    research.badges.push(id)
    saveResearch()
    renderCollection()
    if (localBadgeTrophyMap[id]) unlockTrophy(localBadgeTrophyMap[id])
  }
}

function unlockTrophy(id) {
  if (research.trophies.includes(id)) return
  research.trophies.push(id)
  saveResearch()
  renderTrophies(trophyCatalog, [
    ...research.trophies.map((trophyId) => ({ id: trophyId, earnedAt: true })),
    ...research.badges.map((badge) => localBadgeTrophyMap[badge]).filter(Boolean).map((trophyId) => ({ id: trophyId, earnedAt: true })),
  ])
}

function checkLocalMilestones() {
  const playedEveryGame = research.completedRounds > 0 && research.gaugePlays > 0 && research.mashPlays > 0 && research.catchPlays > 0 && research.memoryPlays > 0
  if (playedEveryGame) unlockTrophy('mini-game-fan')
  const localTrophies = new Set([...research.trophies, ...research.badges.map((badge) => localBadgeTrophyMap[badge]).filter(Boolean)])
  if (localTrophies.size >= 6) unlockTrophy('collection-6')
}

function renderCollection() {
  const grid = document.querySelector('#collection-grid')
  if (!grid) return

  grid.innerHTML = badgeDefinitions.map((badge) => {
    const unlocked = research.badges.includes(badge.id)
    return `
      <article class="badge-card ${unlocked ? 'is-unlocked' : 'is-locked'}">
        <span class="badge-icon" aria-hidden="true">${unlocked ? badge.icon : '？'}</span>
        <span class="badge-name">${unlocked ? badge.title : '비밀 연구'}</span>
        <small>${badge.detail}</small>
        <span class="badge-state">${unlocked ? '수집 완료' : '미발견'}</span>
      </article>
    `
  }).join('')
  document.querySelector('#badge-count').textContent = research.badges.length
  document.querySelector('#round-record').textContent = research.completedRounds
  document.querySelector('#sugar-record').textContent = research.bestSugar ? `${research.bestSugar}°S` : '—'
  document.querySelector('#mash-record').textContent = research.bestMashes
}

function makeSamples() {
  const spriteOrder = shuffle(chamiSprites)
  return Array.from({ length: sampleCount }, (_, index) => ({
    id: index + 1,
    sugar: Math.floor(Math.random() * 46) + 54,
    sprite: spriteOrder[index],
    revealed: false,
  }))
}

function renderSamples(animateId = null) {
  const board = document.querySelector('#sample-board')
  board.innerHTML = samples.map((sample) => `
    <article class="sample ${sample.revealed ? 'is-revealed' : ''} ${sample.winner ? 'is-sweetest' : ''} ${sample.id === animateId ? 'just-measured' : ''}" data-id="${sample.id}">
      <span class="sample-number">SAMPLE 0${sample.id}</span>
      <span class="sample-figure" style="--hit-tilt:${Math.round(Math.random() * 44 - 22)}deg; --hit-shift:${Math.round(Math.random() * 28 - 14)}px">
        <img src="${sample.sprite}" alt="" loading="lazy" fetchpriority="low" decoding="async" />
        <span class="impact" aria-hidden="true">팡!${sample.revealed ? `<small>${sample.sugar}°S</small>` : ''}</span>
      </span>
      <span class="sugar-result">${sample.revealed ? `${sample.sugar}<small>°S</small>` : '<small>측정 대기 중</small>'}</span>
      ${sample.winner ? '<span class="winner-tag">당도 1위 ✦</span>' : ''}
    </article>
  `).join('')
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
  const unopened = samples.filter((sample) => !sample.revealed)
  if (unopened.length === 0) return

  const sample = unopened[Math.floor(Math.random() * unopened.length)]
  sample.revealed = true
  renderSamples(sample.id)
  launchSugarBurst(sample.id)
  if ('vibrate' in navigator) navigator.vibrate([42, 22, 76])
  const remaining = samples.filter((item) => !item.revealed).length
  document.querySelector('#progress-count').textContent = sampleCount - remaining
  document.querySelector('#lab-status').textContent = remaining > 0
    ? `차미 ${String(sample.id).padStart(2, '0')} — ${sample.sugar}°S. ${measurementNotes[Math.floor(Math.random() * measurementNotes.length)]}`
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
      winners.forEach((winner) => { winner.winner = true })
      research.completedRounds += 1
      research.bestSugar = Math.max(research.bestSugar, highest)
      saveResearch()
      unlockTrophy('first-round')
      if (research.bestSugar >= 95) { unlockBadge('sugar-overload'); unlockTrophy('sweet-95') }
      if (research.bestSugar >= 99) unlockTrophy('sweet-99')
      if (samples.every((item) => item.sugar >= 80)) { unlockBadge('all-sweet'); unlockTrophy('all-sweet') }
      if (research.completedRounds >= 5) unlockBadge('veteran')
      if (research.completedRounds >= 20) unlockTrophy('rounds-20')
      if (research.completedRounds >= 50) unlockBadge('lab-legend')
      checkLocalMilestones()
      renderCollection()
      renderSamples()
      const winnerIds = winners.map((winner) => `차미 ${String(winner.id).padStart(2, '0')}`).join(' · ')
      document.querySelector('#winner-title').textContent = winners.length > 1 ? '공동 당도왕 탄생!' : '오늘의 당도왕!'
      document.querySelector('#winner-copy').textContent = `${winnerIds} — ${highest}°S. 당도계가 왕관을 씌우려다 설탕에 붙었습니다.`
      document.querySelector('#winner-panel').hidden = false
      document.querySelector('#winner-panel').classList.add('is-visible')
      document.querySelector('#lab-status').textContent = `최고 당도 ${highest}°S! ${winnerIds}가 오늘의 당도왕이에요.`
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
  document.querySelector('#lab-status').textContent = '버튼을 누르면 차미 한 명이 무작위로 팡! 측정돼요.'
  document.querySelector('#progress-count').textContent = '0'
  document.querySelector('#winner-panel').hidden = true
  document.querySelector('#winner-panel').classList.remove('is-visible')
  const popButton = document.querySelector('#pop-button')
  popButton.disabled = false
  popButton.querySelector('.pop-title').textContent = '차미 팡!'
  popButton.querySelector('.pop-subtitle').innerHTML = '랜덤 측정 <i aria-hidden="true">↗</i>'
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
  saveResearch()
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
  if (difference <= 2) unlockBadge('steady-hand')
  if (research.precisionHits >= 10) unlockTrophy('precision-10')
  checkLocalMilestones()
}

function finishFizzRound() {
  clearInterval(fizzState.timer)
  fizzState.running = false
  submitGameEvent({ type: 'mash_result', count: fizzState.count })
  research.mashPlays += 1
  research.bestMashes = Math.max(research.bestMashes, fizzState.count)
  saveResearch()
  renderCollection()
  if (fizzState.count >= 18) unlockBadge('rapid-paws')
  if (fizzState.count >= 18) unlockTrophy('rapid-paws')
  if (research.bestMashes >= 30) unlockTrophy('fizz-master')
  checkLocalMilestones()
  document.querySelector('#fizz-button').textContent = '한 판 더 팡팡!'
  document.querySelector('#fizz-status').textContent = fizzState.count >= 18
    ? `${fizzState.count}회! 차미가 팝콘인 줄 알고 줄을 섰어요. 팡팡 장인 배지 획득!`
    : `${fizzState.count}회 팡! 차미는 아직 통통합니다. 18회면 팡팡 장인이에요.`
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
  saveResearch()
  if (research.bestCatches >= 5) unlockTrophy('chami-catcher')
  if (research.bestCatches >= 15) unlockTrophy('chami-catcher-15')
  checkLocalMilestones()
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

function renderMemoryBoard() {
  const board = document.querySelector('#memory-board')
  const focusedIndex = document.activeElement instanceof Element
    ? document.activeElement.closest('.memory-card')?.dataset.cardIndex
    : null
  board.innerHTML = memoryState.deck.map((card, index) => {
    const isFaceUp = memoryState.open.includes(index) || memoryState.matched.has(card.pair)
    return `<button class="memory-card ${isFaceUp ? 'is-face-up' : ''} ${memoryState.matched.has(card.pair) ? 'is-matched' : ''}" type="button" data-card-index="${index}" aria-label="${isFaceUp ? '차미 표본 공개' : `표본 카드 ${index + 1} 뒤집기`}" aria-pressed="${isFaceUp}" ${memoryState.active ? '' : 'disabled'}>
      <span class="memory-card-inner"><span class="memory-card-back" aria-hidden="true"><svg class="asterisk-shape" viewBox="0 0 100 100"><path d="M50 0 60 34 82 12 67 40 100 50 67 60 82 88 60 66 50 100 40 66 18 88 33 60 0 50 33 40 18 12 40 34Z" fill="currentColor"/></svg></span><span class="memory-card-front"><img src="${card.sprite}" alt="" loading="lazy" fetchpriority="low" decoding="async" /></span></span>
    </button>`
  }).join('')
  if (focusedIndex !== null && focusedIndex !== undefined) {
    board.querySelector(`[data-card-index="${focusedIndex}"]`)?.focus({ preventScroll: true })
  }
}

function makeMemoryDeck() {
  const pairSprites = shuffle([...new Set(chamiSprites)]).slice(0, 4)
  return shuffle(pairSprites.flatMap((sprite, pair) => [{ sprite, pair }, { sprite, pair }]))
}

function startMemoryGame() {
  window.clearTimeout(memoryState.mismatchTimer)
  window.clearTimeout(memoryState.clockTimer)
  memoryState = {
    active: true,
    locked: false,
    deck: makeMemoryDeck(),
    open: [],
    matched: new Set(),
    moves: 0,
    startedAt: Date.now(),
    mismatchTimer: null,
    clockTimer: null,
  }
  document.querySelector('#memory-moves').textContent = '0'
  document.querySelector('#memory-clock').textContent = '0'
  document.querySelector('#memory-start-button').textContent = '다시 섞기'
  document.querySelector('#memory-status').textContent = '표본을 뒤집어 같은 차미끼리 짝을 맞춰봐요!'
  document.querySelector('#memory-game').classList.remove('is-memory-complete')
  renderMemoryBoard()
}

function finishMemoryGame() {
  memoryState.active = false
  window.clearTimeout(memoryState.clockTimer)
  const seconds = Math.max(1, Math.round((Date.now() - memoryState.startedAt) / 1000))
  const isGold = memoryState.moves <= 6 && seconds <= 30
  research.memoryPlays += 1
  research.bestMemoryMoves = research.bestMemoryMoves ? Math.min(research.bestMemoryMoves, memoryState.moves) : memoryState.moves
  if (isGold) research.memoryGolds += 1
  saveResearch()
  unlockBadge('memory-first')
  if (memoryState.moves <= 8) unlockBadge('memory-analyst')
  if (isGold) unlockBadge('memory-gold')
  if (research.memoryGolds >= 5) unlockBadge('memory-master')
  checkLocalMilestones()
  submitGameEvent({ type: 'memory_result', moves: memoryState.moves, seconds })
  document.querySelector('#memory-game').classList.add('is-memory-complete')
  document.querySelector('#memory-start-button').textContent = '한 판 더 연구하기'
  document.querySelector('#memory-status').textContent = isGold
    ? `${memoryState.moves}수 · ${seconds}초! 황금 기억력 트로피 획득이에요!`
    : memoryState.moves <= 8
      ? `${memoryState.moves}수 · ${seconds}초! 눈썰미 연구원 트로피 획득이에요.`
      : `${memoryState.moves}수 · ${seconds}초 만에 완주했어요! 다음엔 더 적은 수에 도전해봐요.`
}

function selectMemoryCard(event) {
  if (!(event.target instanceof Element)) return
  const card = event.target.closest('.memory-card')
  if (!card || !memoryState.active || memoryState.locked) return
  const index = Number(card.dataset.cardIndex)
  const item = memoryState.deck[index]
  if (!item || memoryState.open.includes(index) || memoryState.matched.has(item.pair)) return
  memoryState.open.push(index)
  renderMemoryBoard()
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
    document.querySelector('#memory-status').textContent = `짝을 찾았어요! ${memoryState.matched.size} / 4쌍 발견`
    if (memoryState.matched.size === 4) finishMemoryGame()
    return
  }

  memoryState.locked = true
  document.querySelector('#memory-status').textContent = '다른 표본이에요. 위치를 기억해두세요!'
  memoryState.mismatchTimer = window.setTimeout(() => {
    memoryState.open = []
    memoryState.locked = false
    renderMemoryBoard()
  }, 720)
}

function tickMemoryClock() {
  if (!memoryState.active) return
  document.querySelector('#memory-clock').textContent = Math.floor((Date.now() - memoryState.startedAt) / 1000)
  memoryState.clockTimer = window.setTimeout(tickMemoryClock, 250)
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
      <a href="#collection">수집첩</a>
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
        <div class="speech-card" aria-label="시트리의 대사"><span class="speech-dot" aria-hidden="true"></span><span class="speech-line">${sitriDialogues[Math.floor(Math.random() * sitriDialogues.length)]}</span><span class="speech-timer" aria-hidden="true"><span class="speech-timer-fill"></span></span></div>
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
        <div class="pop-explainer"><svg class="pop-star asterisk-shape" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0 60 34 82 12 67 40 100 50 67 60 82 88 60 66 50 100 40 66 18 88 33 60 0 50 33 40 18 12 40 34Z" fill="currentColor"/></svg><span><b>누가 나올지는 시트리도 몰라요.</b><small>여섯 번 팡! 해서 당도왕을 찾아보세요.</small></span></div>
        <button class="pop-button" id="pop-button" type="button">
          <span class="pop-title">차미 팡!</span><span class="pop-subtitle">랜덤 측정 <i aria-hidden="true">↗</i></span>
        </button>
      </div>
      <div class="sample-board" id="sample-board"></div>
      <div class="winner-panel" id="winner-panel" hidden aria-live="polite">
        <span class="winner-crown" aria-hidden="true">♛</span>
        <span><b id="winner-title">오늘의 당도왕!</b><small id="winner-copy"></small></span>
        <span class="winner-confetti" aria-hidden="true"><i>✦</i><svg class="asterisk-shape" viewBox="0 0 100 100"><path d="M50 0 60 34 82 12 67 40 100 50 67 60 82 88 60 66 50 100 40 66 18 88 33 60 0 50 33 40 18 12 40 34Z" fill="currentColor"/></svg><i>✦</i></span>
      </div>
      <div class="lab-footer">
        <p id="lab-status" role="status" aria-live="polite">버튼을 누르면 차미 한 명이 무작위로 팡! 측정돼요.</p>
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
          <div class="gauge-readout"><span>현재 측정값</span><b id="gauge-readout">—<small>°S</small></b></div>
          <div class="gauge-track" aria-label="당도계 바늘 눈금">
            <span class="gauge-target" id="gauge-target" style="left:50%"><i>목표</i></span>
            <span class="gauge-needle" id="gauge-needle"></span>
          </div>
          <div class="gauge-labels"><span>덜 달다</span><span>너무 달다</span></div>
          <button class="mini-game-button" id="gauge-button" type="button">측정 시작</button>
          <p class="mini-game-status" id="gauge-status" role="status" aria-live="polite">초록 구간 안에서 멈추면 정밀 연구원에 가까워져요.</p>
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
          <p class="mini-game-status" id="fizz-status" role="status" aria-live="polite">7초 안에 18번 누르면 팡팡 장인!</p>
        </article>
      </div>
    </section>

    <section class="collection-section" id="collection" aria-labelledby="collection-title">
      <div class="section-heading collection-heading">
        <div>
          <p class="kicker"><span></span> 차미 연구 기록</p>
          <h2 id="collection-title">연구원 수집첩</h2>
          <p>실험하고, 기록하고, 괜히 뿌듯해하세요.</p>
        </div>
        <div class="collection-count"><b id="badge-count">0</b><span> / ${String(badgeDefinitions.length).padStart(2, '0')} 배지</span></div>
      </div>
      <div class="research-stats">
        <div><span>완료한 연구</span><b id="round-record">0</b><small>ROUND</small></div>
        <div><span>역대 최고 당도</span><b id="sugar-record">—</b><small>°S</small></div>
        <div><span>기포 제거 기록</span><b id="mash-record">0</b><small>회</small></div>
      </div>
      <div class="collection-grid" id="collection-grid"></div>
      <p class="collection-note">연구 기록은 이 브라우저에 저장돼요. 다른 기기에서는 새 연구원이 됩니다.</p>
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
    <p class="mini-game-status" id="catch-status" role="status" aria-live="polite">5마리 잡으면 재빠른 앞발 트로피!</p>
  </article>
  <article class="mini-game-card memory-game" id="memory-game">
    <div class="mini-game-topline"><span>05 · 차미 표본 정리</span><span class="mini-game-icon" aria-hidden="true">🧩</span></div>
    <h3>같은 차미를 찾아라!</h3>
    <p class="mini-game-copy">8장의 표본에서 네 쌍을 찾아요. 8수 이내면 눈썰미 연구원, 6수·30초 이내면 황금 트로피에 도전할 수 있어요.</p>
    <div class="memory-score"><b id="memory-moves">0</b><span>뒤집은 횟수</span><small><b id="memory-clock">0</b>초</small></div>
    <div class="memory-board" id="memory-board" aria-label="차미 표본 짝맞추기 카드"></div>
    <button class="mini-game-button" id="memory-start-button" type="button">표본 연구 시작</button>
    <p class="mini-game-status" id="memory-status" role="status" aria-live="polite">4쌍의 표본을 찾아보세요. 완주하면 트로피를 받아요!</p>
  </article>
`)
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
          <article class="ai-disclosure-row is-used"><span class="ai-mark">O · 사용</span><div><b>차미 이미지 생성</b><p>공식 캐릭터의 둥근 몸, 잎 장식 등 특징을 참고해 표정·잎 형태 변형 이미지를 새로 생성했습니다. AI가 스스로 해석한 별도의 그림체로 표현했습니다.</p></div></article>
          <article class="ai-disclosure-row is-used"><span class="ai-mark">O · 사용</span><div><b>문구·기획·코드 AI 보조</b><p>사이트 문구와 대사, 기획·프런트엔드 코드 작성에 AI를 보조 도구로 사용했습니다. 실제 게임 동작과 팡 이펙트는 JavaScript와 CSS로 실행하며, 무작위 선택은 코드의 난수 기능을 사용합니다.</p></div></article>
          <article class="ai-disclosure-row is-unused"><span class="ai-mark">X · 미사용</span><div><b>음성·음악·효과음 생성</b><p>음성 합성, 캐릭터 음성 변환, AI 음악·BGM 및 AI 효과음 생성은 사용하지 않았습니다. 현재 사이트에는 음성·음악 재생 기능이 없습니다.</p></div></article>
          <article class="ai-disclosure-row is-unused"><span class="ai-mark">X · 미사용</span><div><b>영상 생성·모델 학습</b><p>AI 영상 생성은 사용하지 않았습니다. 이 프로젝트에서 공식 자료를 이용한 자체 모델 학습이나 파인튜닝도 하지 않았습니다. 이미지 생성 시 캐릭터와 의상 특징을 참고 입력으로 사용한 것과 모델 학습은 구분됩니다.</p></div></article>
          <article class="ai-disclosure-row is-unused"><span class="ai-mark">X · 미사용</span><div><b>이미지 가공·웹 효과의 생성형 AI 사용</b><p>생성된 이미지를 웹용 크기로 줄이고, 파비콘을 만드는 작업은 코드로 처리했습니다. 업적과 트로피는 페이지에서 보기 기능만 제공합니다. CSS 흔들림, 파티클, 게임 이펙트는 코드로 만든 시각 효과이며 생성형 AI로 만든 영상·애니메이션이 아닙니다.</p></div></article>
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
document.querySelector('main')?.insertAdjacentHTML('beforeend', `
  <section class="collection-section trophy-section" id="trophy-shelf" aria-labelledby="trophy-title">
    <div class="section-heading collection-heading trophy-heading">
      <div><p class="kicker"><span></span> VISITOR ACHIEVEMENTS</p><h2 id="trophy-title">연구 트로피</h2><p>이 브라우저에 저장된 연구 기록과 달성 과제를 모아요.</p></div>
      <div class="trophy-heading-actions"><div class="collection-count"><b id="trophy-count">0</b><span> / ${trophyCatalog.length} 트로피</span></div><button class="view-trophy-button" id="view-trophy-card" type="button"><span aria-hidden="true">✦</span> 업적 카드 보기</button></div>
    </div>
    <div class="collection-grid trophy-grid" id="trophy-grid" aria-live="polite"></div>
    <p class="collection-note visitor-note">로그인 없이 익명 방문 키로 저장합니다. 쿠키를 지우면 새 방문자로 시작합니다.</p>
  </section>
`)
document.body.insertAdjacentHTML('beforeend', `
  <dialog class="trophy-card-dialog" id="trophy-card-dialog" aria-labelledby="trophy-card-title">
    <article class="trophy-showcase" id="trophy-showcase">
      <button class="trophy-showcase-close" id="trophy-showcase-close" type="button" aria-label="업적 카드 닫기">✕</button>
      <section class="trophy-showcase-art" aria-label="SITRY 팬 일러스트">
        <img src="/images/sitri-hero-expanded.png" alt="시트리 팬 일러스트" loading="lazy" fetchpriority="low" decoding="async" />
        <span class="trophy-art-label">SITRY · SUGAR RESEARCHER</span>
      </section>
      <section class="trophy-showcase-info">
        <p class="kicker"><span></span> SUGAR LAB · RESEARCH FILE</p>
      <h2 id="trophy-card-title">차미 당도 연구 카드</h2>
        <p class="trophy-showcase-subtitle">오늘의 연구 기록과 트로피</p>
        <div class="trophy-showcase-stats" id="trophy-showcase-stats"></div>
        <div class="trophy-showcase-progress"><span id="trophy-showcase-progress-fill"></span></div>
        <p class="trophy-showcase-count" id="trophy-showcase-count"></p>
        <div class="trophy-showcase-grid" id="trophy-showcase-grid"></div>
      </section>
    </article>
  </dialog>
`)
document.body.insertAdjacentHTML('beforeend', `
  <aside class="floating-sitri" id="floating-sitri" aria-label="시트리의 한마디">
    <div class="floating-sitri-bubble"><span class="speech-dot" aria-hidden="true"></span><span id="floating-sitri-line"></span></div>
    <img id="floating-sitri-image" src="/images/variants/sitri/sitri-wave-mascot.png" alt="시트리 SD 캐릭터" loading="lazy" fetchpriority="low" decoding="async" />
  </aside>
`)

const floatingSitri = document.querySelector('#floating-sitri')
const floatingSitriImage = document.querySelector('#floating-sitri-image')
const floatingSitriLine = document.querySelector('#floating-sitri-line')
const floatingSitriToggle = document.querySelector('#floating-sitri-toggle')
const sitriPoses = ['sitri-wave-mascot', 'sitri-pointing-mascot', 'sitri-trophy-mascot', 'sitri-sugar-meter-mascot']
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

function setFloatingSitriEnabled(enabled) {
  floatingSitriEnabled = enabled
  floatingSitri.classList.toggle('is-disabled', !enabled)
  floatingSitri.setAttribute('aria-hidden', String(!enabled))
  floatingSitriToggle.setAttribute('aria-pressed', String(enabled))
  floatingSitriToggle.setAttribute('aria-label', `시트리 요정 ${enabled ? '끄기' : '켜기'}`)
  floatingSitriToggle.querySelector('.sitri-toggle-wide').textContent = `시트리 요정 ${enabled ? '켜짐' : '꺼짐'}`
  floatingSitriToggle.querySelector('.sitri-toggle-short').textContent = `요정 ${enabled ? '켜짐' : '꺼짐'}`
  if (!enabled && floaterFrame !== null) {
    cancelAnimationFrame(floaterFrame)
    floaterFrame = null
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
  if (reducedMotion) {
    floaterX = targetX
    floaterY = targetY
    floatingSitri.style.left = `${floaterX}px`
    floatingSitri.style.top = `${floaterY}px`
    return
  }
  if (floaterFrame === null) {
    lastFloaterFrame = 0
    floaterFrame = requestAnimationFrame(moveFloaterFrame)
  }
}

function moveFloaterFrame(now = performance.now()) {
  const delta = lastFloaterFrame ? Math.min((now - lastFloaterFrame) / 1000, 0.05) : 0.016
  lastFloaterFrame = now
  const response = reducedMotion ? 100 : now < clickChaseUntil ? 4.2 : 0.62
  const easing = 1 - Math.exp(-response * delta)
  if (reducedMotion) {
    floaterX = targetX
    floaterY = targetY
  } else {
    floaterX += (targetX - floaterX) * easing
    floaterY += (targetY - floaterY) * easing
  }
  floatingSitri.style.left = `${floaterX}px`
  floatingSitri.style.top = `${floaterY}px`
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
  if (!floatingSitriEnabled || target?.closest('#floating-sitri-toggle')) return
  const heroSitri = target?.closest('.hero-art .sitri')
  const inContext = (selector) => Boolean(target?.closest(selector))

  if (heroSitri) sayAsSitri(sitriGameLines.hero, 'sitri-wave-mascot')
  else if (inContext('#pop-button, .sample')) sayAsSitri(sitriGameLines.pop, 'sitri-sugar-meter-mascot')
  else if (inContext('#gauge-button, #gauge-game')) sayAsSitri(sitriGameLines.gauge, 'sitri-pointing-mascot')
  else if (inContext('#fizz-button, #fizz-game')) sayAsSitri(sitriGameLines.fizz, 'sitri-sugar-meter-mascot')
  else if (inContext('#catch-start-button, #catch-target, #catch-game')) sayAsSitri(sitriGameLines.catch, 'sitri-wave-mascot')
  else if (inContext('#memory-start-button, #memory-board, #memory-game')) sayAsSitri(sitriGameLines.memory, 'sitri-pointing-mascot')
  else if (inContext('#guidelines-open')) sayAsSitri(sitriGameLines.guideline, 'sitri-pointing-mascot')
  else if (inContext('#collection, #trophy-shelf')) sayAsSitri(sitriGameLines.collection, 'sitri-trophy-mascot')
  else if (inContext('#mini-games')) sayAsSitri(sitriGameLines.miniGames, 'sitri-pointing-mascot')
  else if (inContext('#lab')) sayAsSitri(sitriGameLines.lab, 'sitri-sugar-meter-mascot')
  else sayAsSitri(sitriGameLines.default)

  let pointX = event.clientX
  let pointY = event.clientY
  if (event.detail === 0 && target) {
    const bounds = target.getBoundingClientRect()
    pointX = bounds.left + bounds.width / 2
    pointY = bounds.top + bounds.height / 2
  }
  setFloaterTarget(pointX + (pointX < window.innerWidth / 2 ? 92 : -92), pointY - 76)
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
const heroSpeechLine = document.querySelector('.speech-line')
const heroSpeechTimer = document.querySelector('.speech-timer-fill')
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
renderTrophies(trophyCatalog, [
  ...research.trophies.map((id) => ({ id, earnedAt: true })),
  ...research.badges.map((badge) => localBadgeTrophyMap[badge]).filter(Boolean).map((id) => ({ id, earnedAt: true })),
])
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
  const stats = lastServerProfile?.stats || {
    completed_rounds: research.completedRounds,
    best_sugar: research.bestSugar,
    best_mashes: research.bestMashes,
  }
  const visibleTrophies = [...document.querySelectorAll('#trophy-grid .trophy-card')]
  const earnedCount = visibleTrophies.filter((card) => card.classList.contains('is-earned')).length
  const trophyTotal = visibleTrophies.length || trophyCatalog.length
  document.querySelector('#trophy-showcase-stats').innerHTML = [
    ['완료 연구', Number(stats.completed_rounds) || 0, 'ROUND'],
    ['최고 당도', Number(stats.best_sugar) || 0, '°S'],
    ['최고 팡팡', Number(stats.best_mashes) || 0, '회'],
  ].map(([label, value, unit]) => `<div><small>${label}</small><b>${value}<em>${unit}</em></b></div>`).join('')
  document.querySelector('#trophy-showcase-count').textContent = `트로피 ${earnedCount} / ${trophyTotal} 달성`
  document.querySelector('#trophy-showcase-progress-fill').style.width = `${trophyTotal ? earnedCount / trophyTotal * 100 : 0}%`
  const previewGrid = document.querySelector('#trophy-showcase-grid')
  previewGrid.replaceChildren(...visibleTrophies.map((card) => card.cloneNode(true)))
  trophyCardDialog.showModal()
})
document.querySelector('#trophy-showcase-close').addEventListener('click', () => trophyCardDialog.close())
trophyCardDialog.addEventListener('click', (event) => {
  if (event.target === trophyCardDialog) trophyCardDialog.close()
})
trophyShowcase.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
renderCollection()
const beginProfileSync = () => {
  if (!profileSyncPromise) profileSyncPromise = syncServerProfile()
}
if ('requestIdleCallback' in window) window.requestIdleCallback(beginProfileSync, { timeout: 2500 })
else window.setTimeout(beginProfileSync, 800)
