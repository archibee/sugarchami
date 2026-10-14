import { createServer } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import pg from 'pg'
import { schema } from './db/schema.js'

const { Pool } = pg
const root = fileURLToPath(new URL('.', import.meta.url))
const production = process.env.NODE_ENV === 'production'
const cookieName = production ? '__Host-chami_visitor' : 'chami_visitor'
const cookieAge = 60 * 60 * 24 * 400
const maxBodyBytes = 4096
const trophyDefinitions = [
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

function loadLocalEnv() {
  const envPath = resolve(root, '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || Object.hasOwn(process.env, match[1])) continue
    let value = match[2]
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    process.env[match[1]] = value
  }
}

loadLocalEnv()
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
if (!databaseUrl) throw new Error('Set DATABASE_URL in the server environment.')

const pool = new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.PGPOOL_MAX || 4),
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 10000,
})
pool.on('error', () => console.error('PostgreSQL pool connection error.'))

const secureCookie = (request) => production || request.socket.encrypted || request.headers['x-forwarded-proto'] === 'https'
const hashKey = (key) => createHash('sha256').update(key).digest()
const parseCookies = (header = '') => Object.fromEntries(header.split(';').map((item) => {
  const index = item.indexOf('=')
  return index < 0 ? ['', ''] : [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1).trim())]
}))

async function getVisitor(request, response) {
  const cookie = parseCookies(request.headers.cookie)[cookieName]
  const token = cookie && /^[A-Za-z0-9_-]{40,60}$/.test(cookie) ? cookie : null
  if (token) {
    const result = await pool.query('UPDATE visitors SET last_seen_at = now() WHERE key_hash = $1 RETURNING id', [hashKey(token)])
    if (result.rowCount) return result.rows[0].id
  }

  const newToken = randomBytes(32).toString('base64url')
  const id = randomUUID()
  await pool.query('INSERT INTO visitors (id, key_hash) VALUES ($1, $2)', [id, hashKey(newToken)])
  await pool.query('INSERT INTO visitor_stats (visitor_id) VALUES ($1) ON CONFLICT DO NOTHING', [id])
  const flags = ['Path=/', `Max-Age=${cookieAge}`, 'HttpOnly', 'SameSite=Lax']
  if (secureCookie(request)) flags.push('Secure')
  response.setHeader('Set-Cookie', `${cookieName}=${newToken}; ${flags.join('; ')}`)
  return id
}

async function readProfile(visitorId) {
  const [stats, trophies] = await Promise.all([
    pool.query('SELECT completed_rounds, best_sugar, best_mashes, best_catches, catch_plays, gauge_plays, precision_hits, mash_plays, memory_plays, best_memory_moves, memory_golds FROM visitor_stats WHERE visitor_id = $1', [visitorId]),
    pool.query('SELECT trophy_id, earned_at FROM visitor_trophies WHERE visitor_id = $1 ORDER BY earned_at', [visitorId]),
  ])
  return {
    stats: stats.rows[0] || { completed_rounds: 0, best_sugar: 0, best_mashes: 0, best_catches: 0, catch_plays: 0, gauge_plays: 0, precision_hits: 0, mash_plays: 0, memory_plays: 0, best_memory_moves: 0, memory_golds: 0 },
    trophies: trophies.rows.map((row) => ({ id: row.trophy_id, earnedAt: row.earned_at })),
  }
}

function unlock(ids, condition, id) { if (condition) ids.add(id) }

async function recordGameEvent(visitorId, event) {
  if (!event || typeof event !== 'object') throw Object.assign(new Error('Invalid event.'), { status: 400 })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('INSERT INTO visitor_stats (visitor_id) VALUES ($1) ON CONFLICT DO NOTHING', [visitorId])
    const current = await client.query('SELECT * FROM visitor_stats WHERE visitor_id = $1 FOR UPDATE', [visitorId])
    const stats = current.rows[0]
    if (event.type === 'round_complete') {
      if (!Array.isArray(event.sugars) || event.sugars.length !== 6 || event.sugars.some((value) => !Number.isInteger(value) || value < 54 || value > 99)) {
        throw Object.assign(new Error('A round must contain six valid sugar readings.'), { status: 400 })
      }
      const best = Math.max(...event.sugars)
      await client.query('UPDATE visitor_stats SET completed_rounds = completed_rounds + 1, best_sugar = GREATEST(best_sugar, $2), updated_at = now() WHERE visitor_id = $1', [visitorId, best])
    } else if (event.type === 'gauge_result') {
      if (!Number.isInteger(event.difference) || event.difference < 0 || event.difference > 45) throw Object.assign(new Error('Invalid gauge result.'), { status: 400 })
      await client.query('UPDATE visitor_stats SET gauge_plays = gauge_plays + 1, precision_hits = precision_hits + $2, updated_at = now() WHERE visitor_id = $1', [visitorId, event.difference <= 2 ? 1 : 0])
    } else if (event.type === 'mash_result') {
      if (!Number.isInteger(event.count) || event.count < 0 || event.count > 1000) throw Object.assign(new Error('Invalid mash result.'), { status: 400 })
      await client.query('UPDATE visitor_stats SET mash_plays = mash_plays + 1, best_mashes = GREATEST(best_mashes, $2), updated_at = now() WHERE visitor_id = $1', [visitorId, event.count])
    } else if (event.type === 'catch_result') {
      if (!Number.isInteger(event.count) || event.count < 0 || event.count > 1000) throw Object.assign(new Error('Invalid catch result.'), { status: 400 })
      await client.query('UPDATE visitor_stats SET catch_plays = catch_plays + 1, best_catches = GREATEST(best_catches, $2), updated_at = now() WHERE visitor_id = $1', [visitorId, event.count])
    } else if (event.type === 'memory_result') {
      if (!Number.isInteger(event.moves) || event.moves < 4 || event.moves > 100 || !Number.isInteger(event.seconds) || event.seconds < 1 || event.seconds > 3600) throw Object.assign(new Error('Invalid memory result.'), { status: 400 })
      const isGold = event.moves <= 6 && event.seconds <= 30
      await client.query('UPDATE visitor_stats SET memory_plays = memory_plays + 1, best_memory_moves = CASE WHEN best_memory_moves = 0 THEN $2 ELSE LEAST(best_memory_moves, $2) END, memory_golds = memory_golds + $3, updated_at = now() WHERE visitor_id = $1', [visitorId, event.moves, isGold ? 1 : 0])
    } else {
      throw Object.assign(new Error('Unknown game event.'), { status: 400 })
    }

    const updated = (await client.query('SELECT * FROM visitor_stats WHERE visitor_id = $1', [visitorId])).rows[0]
    const earned = new Set()
    unlock(earned, updated.completed_rounds >= 1, 'first-round')
    unlock(earned, updated.best_sugar >= 95, 'sweet-95')
    unlock(earned, updated.best_sugar >= 99, 'sweet-99')
    unlock(earned, updated.completed_rounds >= 5, 'rounds-5')
    unlock(earned, updated.completed_rounds >= 20, 'rounds-20')
    unlock(earned, updated.completed_rounds >= 50, 'lab-legend')
    unlock(earned, updated.precision_hits >= 1, 'precision')
    unlock(earned, updated.precision_hits >= 10, 'precision-10')
    unlock(earned, updated.best_mashes >= 18, 'rapid-paws')
    unlock(earned, updated.best_mashes >= 30, 'fizz-master')
    unlock(earned, updated.best_catches >= 5, 'chami-catcher')
    unlock(earned, updated.best_catches >= 15, 'chami-catcher-15')
    unlock(earned, updated.memory_plays >= 1, 'memory-first')
    unlock(earned, updated.best_memory_moves > 0 && updated.best_memory_moves <= 8, 'memory-analyst')
    unlock(earned, updated.memory_golds >= 1, 'memory-gold')
    unlock(earned, updated.memory_golds >= 5, 'memory-master')
    if (event.type === 'round_complete' && event.sugars.every((value) => value >= 80)) earned.add('all-sweet')
    unlock(earned, updated.completed_rounds > 0 && updated.gauge_plays > 0 && updated.mash_plays > 0 && updated.catch_plays > 0 && updated.memory_plays > 0, 'mini-game-fan')
    await client.query(`INSERT INTO visitor_trophies (visitor_id, trophy_id)
      SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING`, [visitorId, [...earned]])
    const trophyCount = Number((await client.query('SELECT count(*) FROM visitor_trophies WHERE visitor_id = $1', [visitorId])).rows[0].count)
    if (trophyCount >= 6) await client.query('INSERT INTO visitor_trophies (visitor_id, trophy_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [visitorId, 'collection-6'])
    await client.query('COMMIT')
    return readProfile(visitorId)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
  response.end(JSON.stringify(data))
}

async function readJson(request) {
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (Buffer.byteLength(body) > maxBodyBytes) throw Object.assign(new Error('Request too large.'), { status: 413 })
  }
  try { return JSON.parse(body || '{}') } catch { throw Object.assign(new Error('Invalid JSON.'), { status: 400 }) }
}

const eventLimits = new Map()
function allowEvent(visitorId) {
  const now = Date.now()
  const state = eventLimits.get(visitorId)
  if (!state || now - state.start > 60_000) { eventLimits.set(visitorId, { start: now, count: 1 }); return true }
  state.count += 1
  return state.count <= 50
}

const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }
function serveStatic(request, response) {
  const dist = resolve(root, 'dist')
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  const requestedPath = pathname === '/' ? '/index.html' : pathname
  let filePath = resolve(dist, `.${requestedPath}`)
  if (!filePath.startsWith(`${dist}${sep}`) && filePath !== resolve(dist, 'index.html')) filePath = resolve(dist, 'index.html')
  if (!existsSync(filePath) || !statSync(filePath).isFile()) filePath = resolve(dist, 'index.html')
  response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' })
  createReadStream(filePath).pipe(response)
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost')
    if (url.pathname === '/api/health' && request.method === 'GET') {
      await pool.query('SELECT 1')
      return sendJson(response, 200, { ok: true })
    }
    if (url.pathname.startsWith('/api/')) {
      if (request.method !== 'GET' && request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' })
      if (request.method === 'POST') {
        const origin = request.headers.origin
        if (origin && new URL(origin).host !== request.headers.host) return sendJson(response, 403, { error: 'Cross-origin request rejected.' })
        if (!String(request.headers['content-type'] || '').includes('application/json')) return sendJson(response, 415, { error: 'JSON required.' })
      }
      const visitorId = await getVisitor(request, response)
      if (url.pathname === '/api/profile' && request.method === 'GET') return sendJson(response, 200, { ...await readProfile(visitorId), trophyDefinitions })
      if (url.pathname === '/api/events' && request.method === 'POST') {
        if (!allowEvent(visitorId)) return sendJson(response, 429, { error: 'Too many events.' })
        const profile = await recordGameEvent(visitorId, await readJson(request))
        return sendJson(response, 200, { ...profile, trophyDefinitions })
      }
      return sendJson(response, 404, { error: 'Not found.' })
    }
    if (request.method === 'GET' || request.method === 'HEAD') return serveStatic(request, response)
    return sendJson(response, 405, { error: 'Method not allowed.' })
  } catch (error) {
    if (error.status) return sendJson(response, error.status, { error: error.message })
    console.error('Request failed:', error.code || error.name || 'server error')
    return sendJson(response, 503, { error: 'Research storage is temporarily unavailable.' })
  }
})

await pool.query(schema)
const port = Number(process.env.PORT || 4173)
server.listen(port, '0.0.0.0', () => console.log(`Chami Sugar Lab server listening on ${port}`))

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0) }))
