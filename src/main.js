import './style.css'

const app = document.querySelector('#app')
const sampleCount = 5
const saveKey = 'chami-sugar-lab-research-v1'
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
  { id: 'mini-game-fan', icon: '🎮', title: '연구소 순회', detail: '네 가지 게임을 모두 플레이' },
  { id: 'collection-6', icon: '✨', title: '트로피 수집가', detail: '트로피 6개 수집' },
  { id: 'chami-catcher', icon: '🐇', title: '재빠른 앞발', detail: '도망 차미 5마리 잡기' },
  { id: 'chami-catcher-15', icon: '🧤', title: '수집왕 차미', detail: '도망 차미 15마리 잡기' },
]
const measurementNotes = [
  '당도계가 잠깐 행복해졌습니다.',
  '시트리가 고개를 끄덕였습니다. 근거는 없습니다.',
  '측정기가 설탕을 보고 살짝 눈을 피합니다.',
  '연구소 기준으로 꽤 수상한 수치입니다.',
  '기계가 방금 작은 박수를 친 것 같습니다.',
]
const badgeDefinitions = [
  { id: 'first-round', icon: '🧪', title: '첫 실험', detail: '차미 5개 당도 측정 완료' },
  { id: 'sugar-overload', icon: '🍯', title: '당도 초과', detail: '95°S 이상 차미 발견' },
  { id: 'all-sweet', icon: '✦', title: '끈적한 연구실', detail: '한 판에서 전원 80°S 이상' },
  { id: 'steady-hand', icon: '🎯', title: '정밀 연구원', detail: '눈금 맞추기 오차 2°S 이하' },
  { id: 'rapid-paws', icon: '💨', title: '팡팡 장인', detail: '7초 안에 18번 팡!' },
  { id: 'veteran', icon: '📔', title: '연구소 단골', detail: '당도 연구 5회 완료' },
]
let samples = []
let roundSerial = 0
let gaugeState = { running: false, target: 50, position: 50, startedAt: 0, frame: null }
let fizzState = { running: false, count: 0, endsAt: 0, timer: null }
let catchState = { running: false, count: 0, endsAt: 0, timer: null, mover: null }
let quickPopTimer = null
let knownTrophies = null
let trophyToastTimer = null
let profileSyncPromise = null

function loadResearch() {
  const fresh = { completedRounds: 0, bestSugar: 0, bestMashes: 0, badges: [] }
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey))
    return { ...fresh, ...saved, badges: Array.isArray(saved?.badges) ? saved.badges : [] }
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
    return `<article class="trophy-card ${date ? 'is-earned' : 'is-locked'}">
      <span class="trophy-icon" aria-hidden="true">${date ? trophy.icon : '🔒'}</span>
      <b>${trophy.title}</b><small>${trophy.detail}</small>
      <span class="trophy-state">${date ? '달성 완료' : '미달성'}</span>
    </article>`
  }).join('')
  const count = document.querySelector('#trophy-count')
  if (count) count.textContent = String(earned.size)
}

function applyServerProfile(profile) {
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
    badges: [
      earned.has('first-round') && 'first-round',
      earned.has('sweet-95') && 'sugar-overload',
      earned.has('all-sweet') && 'all-sweet',
      earned.has('precision') && 'steady-hand',
      earned.has('rapid-paws') && 'rapid-paws',
      earned.has('rounds-5') && 'veteran',
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
    if (profileSyncPromise) await profileSyncPromise
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
  }
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
  return Array.from({ length: sampleCount }, (_, index) => ({
    id: index + 1,
    sugar: Math.floor(Math.random() * 46) + 54,
    revealed: false,
  }))
}

function renderSamples(animateId = null) {
  const board = document.querySelector('#sample-board')
  board.innerHTML = samples.map((sample) => `
    <article class="sample ${sample.revealed ? 'is-revealed' : ''} ${sample.winner ? 'is-sweetest' : ''} ${sample.id === animateId ? 'just-measured' : ''}" data-id="${sample.id}">
      <span class="sample-number">SAMPLE 0${sample.id}</span>
      <span class="sample-figure" style="--hit-tilt:${Math.round(Math.random() * 44 - 22)}deg; --hit-shift:${Math.round(Math.random() * 28 - 14)}px">
        <img src="/images/chami.png" alt="" />
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
    popButton.querySelector('.pop-title').textContent = '측정 완료!'
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
      if (research.completedRounds === 1) unlockBadge('first-round')
      if (samples.some((item) => item.sugar >= 95)) unlockBadge('sugar-overload')
      if (samples.every((item) => item.sugar >= 80)) unlockBadge('all-sweet')
      if (research.completedRounds >= 5) unlockBadge('veteran')
      renderCollection()
      renderSamples()
      const winnerIds = winners.map((winner) => `차미 ${String(winner.id).padStart(2, '0')}`).join(' · ')
      document.querySelector('#winner-title').textContent = winners.length > 1 ? '공동 당도왕 탄생!' : '오늘의 당도왕!'
      document.querySelector('#winner-copy').textContent = `${winnerIds} — ${highest}°S. 당도계가 왕관을 씌우려다 설탕에 붙었습니다.`
      document.querySelector('#winner-panel').hidden = false
      document.querySelector('#winner-panel').classList.add('is-visible')
      document.querySelector('#lab-status').textContent = `최고 당도 ${highest}°S! ${winnerIds}가 오늘의 당도왕이에요.`
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
}

function finishFizzRound() {
  clearInterval(fizzState.timer)
  fizzState.running = false
  submitGameEvent({ type: 'mash_result', count: fizzState.count })
  research.bestMashes = Math.max(research.bestMashes, fizzState.count)
  saveResearch()
  renderCollection()
  if (fizzState.count >= 18) unlockBadge('rapid-paws')
  document.querySelector('#fizz-button').textContent = '한 판 더 팡팡!'
  document.querySelector('#fizz-status').textContent = fizzState.count >= 18
    ? `${fizzState.count}회! 차미가 팝콘인 줄 알고 줄을 섰어요. 팡팡 장인 배지 획득!`
    : `${fizzState.count}회 팡! 차미는 아직 통통합니다. 18회면 팡팡 장인이에요.`
}

function startFizzRound() {
  fizzState.running = true
  fizzState.count = 0
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
  document.querySelector('#catch-target').disabled = true
  document.querySelector('#catch-start-button').textContent = '한 판 더!'
  document.querySelector('#catch-status').textContent = `${catchState.count}마리 포착! 차미가 연구소 CCTV 사각지대로 도망갔어요.`
}

function startCatchRound() {
  if (catchState.running) return
  catchState.running = true
  catchState.count = 0
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

function quickPop() {
  if (quickPopTimer) return
  if (samples.every((sample) => sample.revealed)) resetLab()
  document.querySelector('#lab').scrollIntoView({ behavior: 'smooth', block: 'center' })
  const button = document.querySelector('#quick-pop')
  button.disabled = true
  quickPopTimer = window.setTimeout(() => {
    measureRandomSample()
    button.disabled = false
    quickPopTimer = null
  }, 260)
}

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#top" aria-label="차미 당도 연구소 홈">
      <span class="brand-mark" aria-hidden="true">✳</span>
      <span>차미 당도 연구소<small>CHAMI SUGAR LAB</small></span>
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
        <span class="hero-spark spark-one" aria-hidden="true">✳</span>
        <span class="hero-spark spark-two" aria-hidden="true">✦</span>
        <img class="sitri" src="/images/sitri-hero-expanded.png" alt="머리 장식부터 허벅지까지 온전히 보이는 시트리 일러스트" />
        <div class="speech-card"><span class="speech-dot"></span> 자, 누가 제일 달콤할까?</div>
        <span class="art-caption">SITRI · SUGAR RESEARCHER</span>
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
          <button class="reset-button" id="reset-button" type="button">새 연구 <span aria-hidden="true">↻</span></button>
        </div>
      </div>
      <div class="pop-action">
        <div class="pop-explainer"><span class="pop-star" aria-hidden="true">✳</span><span><b>누가 나올지는 시트리도 몰라요.</b><small>다섯 번 팡! 해서 당도왕을 찾아보세요.</small></span></div>
        <button class="pop-button" id="pop-button" type="button">
          <span class="pop-title">차미 팡!</span><span class="pop-subtitle">랜덤 측정 <i aria-hidden="true">↗</i></span>
        </button>
      </div>
      <div class="sample-board" id="sample-board"></div>
      <div class="winner-panel" id="winner-panel" hidden aria-live="polite">
        <span class="winner-crown" aria-hidden="true">♛</span>
        <span><b id="winner-title">오늘의 당도왕!</b><small id="winner-copy"></small></span>
        <span class="winner-confetti" aria-hidden="true">✦ ✳ ✦</span>
      </div>
      <div class="lab-footer">
        <p id="lab-status" role="status" aria-live="polite">버튼을 누르면 차미 한 명이 무작위로 팡! 측정돼요.</p>
        <span class="progress-label"><b id="progress-count">0</b> / 05 CHECKED</span>
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
          <div class="mini-game-topline"><span>02 · 정밀 측정실</span><span class="mini-game-icon" aria-hidden="true">⌁</span></div>
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
          <div class="mini-game-topline"><span>03 · 기포 제거반</span><span class="mini-game-icon" aria-hidden="true">✳</span></div>
          <h3>차미 기포 빼기</h3>
          <p class="mini-game-copy">차미 안에 기포가 들어갔대요. 7초 동안 팡팡 눌러서 빼주세요!</p>
          <div class="fizz-stage">
            <div class="fizz-chami"><img src="/images/chami.png" alt="" /><span class="fizz-bubble bubble-one"></span><span class="fizz-bubble bubble-two"></span><span class="fizz-bubble bubble-three"></span></div>
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
          <p class="kicker"><span></span> CHAMI RESEARCH ARCHIVE</p>
          <h2 id="collection-title">연구원 수집첩</h2>
          <p>실험하고, 기록하고, 괜히 뿌듯해하세요.</p>
        </div>
        <div class="collection-count"><b id="badge-count">0</b><span> / 06 배지</span></div>
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

  <footer class="site-footer"><span>CHAMI SUGAR LAB</span><span>작은 차미들의 당도를 연구하는 곳</span><span>FAN GAME · MADE WITH ♥</span></footer>
`

document.querySelector('.mini-game-grid')?.insertAdjacentHTML('beforeend', `
  <article class="mini-game-card catch-game" id="catch-game">
    <div class="mini-game-topline"><span>04 · 도망 차미 포착</span><span class="mini-game-icon" aria-hidden="true">🐇</span></div>
    <h3>차미 잡아라!</h3>
    <p class="mini-game-copy">10초 동안 도망치는 차미를 눌러 포착하세요. 연속으로 잡으면 기록을 남겨요!</p>
    <div class="catch-score"><b id="catch-count">0</b><span>마리 포착</span><small><b id="catch-clock">10.0</b>초 남음</small></div>
    <div class="catch-arena" id="catch-arena" aria-label="움직이는 차미 포착 구역">
      <button class="catch-target" id="catch-target" type="button" aria-label="도망치는 차미 잡기" disabled><img src="/images/chami.png" alt="차미" /></button>
      <span class="catch-combo" id="catch-combo" aria-hidden="true">잡았다!</span>
    </div>
    <div class="fizz-timer catch-timer"><span id="catch-timer-fill"></span></div>
    <button class="mini-game-button" id="catch-start-button" type="button">10초 포착 실험 시작</button>
    <p class="mini-game-status" id="catch-status" role="status" aria-live="polite">5마리 잡으면 재빠른 앞발 트로피!</p>
  </article>
`)
document.body.insertAdjacentHTML('beforeend', `
  <nav class="quick-dock" aria-label="빠른 게임 메뉴">
    <button id="quick-pop" type="button"><span aria-hidden="true">💥</span> 차미 팡!</button>
    <a href="#mini-games"><span aria-hidden="true">🎮</span> 미니게임</a>
    <a href="#trophy-shelf"><span aria-hidden="true">🏆</span> 트로피</a>
  </nav>
`)

document.querySelector('.collection-section')?.insertAdjacentHTML('beforeend', `
  <div class="trophy-shelf" id="trophy-shelf">
    <div class="trophy-heading"><div><p class="kicker"><span></span> VISITOR ACHIEVEMENTS</p><h3>연구 트로피</h3><p>이 브라우저에 저장된 연구 기록과 달성 과제를 모아요.</p></div><strong><b id="trophy-count">0</b> / 14</strong></div>
    <div class="trophy-grid" id="trophy-grid" aria-live="polite"></div>
    <p class="visitor-note">로그인 없이 익명 방문 키로 저장합니다. 쿠키를 지우면 새 방문자로 시작합니다.</p>
  </div>
`)
renderTrophies(trophyCatalog, [])

samples = makeSamples()
renderSamples()
document.querySelector('#reset-button').addEventListener('click', resetLab)
document.querySelector('#pop-button').addEventListener('click', measureRandomSample)
document.querySelector('#gauge-button').addEventListener('click', useGauge)
document.querySelector('#fizz-button').addEventListener('click', tapFizzButton)
document.querySelector('#catch-start-button').addEventListener('click', startCatchRound)
document.querySelector('#catch-target').addEventListener('click', catchChami)
document.querySelector('#quick-pop').addEventListener('click', quickPop)
renderCollection()
profileSyncPromise = syncServerProfile()
