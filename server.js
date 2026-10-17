import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import pg from 'pg'
import { schema } from './db/schema.js'

const { Pool } = pg
const root = fileURLToPath(new URL('.', import.meta.url))
const production = process.env.NODE_ENV === 'production'
const maxBodyBytes = 1024 * 1024
const sessionCookie = 'chami_research_session'
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NO_SSL
const pgConfig = databaseUrl
  ? { connectionString: databaseUrl }
  : process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE
    ? {
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
      }
    : null
const pool = pgConfig
  ? new Pool({ ...pgConfig, max: 4, connectionTimeoutMillis: 1800, idleTimeoutMillis: 10000 })
  : null
let schemaReady = null

if (pool) pool.on('error', () => {})

function sendJson(response, status, data) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  if (typeof response.status === 'function' && typeof response.json === 'function') {
    for (const [name, value] of Object.entries(headers)) response.setHeader(name, value)
    return response.status(status).json(data)
  }
  response.writeHead(status, headers)
  response.end(JSON.stringify(data))
}

async function readJson(request) {
  let parsedBody
  try {
    parsedBody = request.body
  } catch {
    throw Object.assign(new Error('Invalid JSON.'), { status: 400 })
  }
  if (parsedBody !== undefined) {
    try {
      const parsed = parsedBody
      const rawBody = Buffer.isBuffer(parsed) ? parsed.toString('utf8') : typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
      if (Buffer.byteLength(rawBody || '') > maxBodyBytes) throw Object.assign(new Error('Request too large.'), { status: 413 })
      if (typeof parsed === 'string' || Buffer.isBuffer(parsed)) {
        try { return JSON.parse(rawBody || '{}') } catch { throw Object.assign(new Error('Invalid JSON.'), { status: 400 }) }
      }
      return parsed
    } catch (error) {
      if (error.status) throw error
      throw Object.assign(new Error('Invalid JSON.'), { status: 400 })
    }
  }
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (Buffer.byteLength(body) > maxBodyBytes) throw Object.assign(new Error('Request too large.'), { status: 413 })
  }
  try { return JSON.parse(body || '{}') } catch { throw Object.assign(new Error('Invalid JSON.'), { status: 400 }) }
}

function ensureSchema() {
  if (!pool) throw Object.assign(new Error('Database is disabled.'), { status: 503 })
  if (!schemaReady) {
    schemaReady = pool.query(schema).catch((error) => {
      schemaReady = null
      throw error
    })
  }
  return schemaReady
}

function getSessionToken(request) {
  const cookieHeader = request.headers.cookie || ''
  const found = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookie}=`))
  const candidate = found?.slice(sessionCookie.length + 1)
  if (candidate && /^[A-Za-z0-9_-]{43}$/.test(candidate)) return { token: candidate, isNew: false }
  return { token: randomBytes(32).toString('base64url'), isNew: true }
}

function normalizeResearch(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Invalid research record.'), { status: 400 })
  }

  const integer = (value, max = 2147483647) => {
    const number = Number(value)
    return Number.isFinite(number) ? Math.max(0, Math.min(max, Math.floor(number))) : 0
  }
  const record = {
    completedRounds: integer(input.completedRounds),
    bestSugar: integer(input.bestSugar, 99),
    bestMashes: integer(input.bestMashes),
    bestCatches: integer(input.bestCatches),
    catchPlays: integer(input.catchPlays),
    gaugePlays: integer(input.gaugePlays),
    precisionHits: integer(input.precisionHits),
    mashPlays: integer(input.mashPlays),
    bestMemoryMoves: integer(input.bestMemoryMoves),
    memoryPlays: integer(input.memoryPlays),
    memoryGolds: integer(input.memoryGolds),
    molePlays: integer(input.molePlays),
    radarPlays: integer(input.radarPlays),
    towerPlays: integer(input.towerPlays),
    pingpongPlays: integer(input.pingpongPlays),
    totalScore: integer(input.totalScore, Number.MAX_SAFE_INTEGER),
    siteTimeRemainderMs: integer(input.siteTimeRemainderMs, 999),
    earnedChamis: Array.isArray(input.earnedChamis)
      ? input.earnedChamis.slice(0, 10000).filter((sprite) => typeof sprite === 'string' && /^\/images\/variants\/chami\/chami-[a-z0-9-]+\.png$/.test(sprite))
      : [],
  }
  return record
}

function tierForScore(score) {
  if (score >= 5000) return { id: 'master', name: '최고 등급 마스터', icon: '👑' }
  if (score >= 2500) return { id: 'diamond', name: '다이아', icon: '💎' }
  if (score >= 1200) return { id: 'platinum', name: '플래티넘', icon: '🏆' }
  if (score >= 500) return { id: 'gold', name: '골드', icon: '🥇' }
  if (score >= 160) return { id: 'silver', name: '실버', icon: '🥈' }
  return { id: 'research', name: '연구 중', icon: '🏆' }
}

export async function syncResearch(request, response) {
  if (!pool) return sendJson(response, 503, { error: 'Research storage is disabled.' })
  if (request.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return sendJson(response, 415, { error: 'JSON is required.' })
  }
  const origin = request.headers.origin
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.host) return sendJson(response, 403, { error: 'Cross-origin request denied.' })
    } catch {
      return sendJson(response, 403, { error: 'Invalid request origin.' })
    }
  }

  const payload = await readJson(request)
  const record = normalizeResearch(payload.research)
  const revision = Number(payload.revision)
  if (!Number.isSafeInteger(revision) || revision < 0) return sendJson(response, 400, { error: 'Invalid record revision.' })

  await ensureSchema()
  const session = getSessionToken(request)
  const keyHash = createHash('sha256').update(session.token).digest()
  const client = await pool.connect()
  let rankingRows

  try {
    await client.query('BEGIN')
    const visitor = await client.query(
      `INSERT INTO visitors (id, key_hash) VALUES ($1, $2)
       ON CONFLICT (key_hash) DO UPDATE SET last_seen_at = now()
       RETURNING id`,
      [randomUUID(), keyHash],
    )
    const visitorId = visitor.rows[0].id
    await client.query(
      `INSERT INTO visitor_research (visitor_id, research_record, total_score, client_updated_at)
       VALUES ($1, $2::jsonb, $3, $4)
       ON CONFLICT (visitor_id) DO UPDATE SET
         research_record = CASE WHEN EXCLUDED.client_updated_at >= visitor_research.client_updated_at THEN EXCLUDED.research_record ELSE visitor_research.research_record END,
         total_score = GREATEST(visitor_research.total_score, EXCLUDED.total_score),
         client_updated_at = GREATEST(visitor_research.client_updated_at, EXCLUDED.client_updated_at),
         updated_at = CASE WHEN EXCLUDED.client_updated_at >= visitor_research.client_updated_at THEN now() ELSE visitor_research.updated_at END`,
      [visitorId, JSON.stringify(record), String(record.totalScore), String(revision)],
    )
    const rankings = await client.query(
      `WITH ranked AS (
         SELECT visitor_id, total_score,
           row_number() OVER (ORDER BY total_score DESC, updated_at ASC, visitor_id ASC)::integer AS rank
         FROM visitor_research
         WHERE total_score > 0
       )
       SELECT rank, total_score, visitor_id = $1::uuid AS is_current_visitor
       FROM ranked
       WHERE rank <= 50 OR visitor_id = $1::uuid
       ORDER BY rank`,
      [visitorId],
    )
    rankingRows = rankings.rows
    await client.query('COMMIT')
    if (session.isNew) {
      response.setHeader('Set-Cookie', `${sessionCookie}=${session.token}; Path=/; HttpOnly; SameSite=Lax${production ? '; Secure' : ''}`)
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }

  const entries = rankingRows.filter((row) => Number(row.rank) <= 50).map((row) => {
    const score = Number(row.total_score)
    return { rank: Number(row.rank), score, tier: tierForScore(score), isCurrentVisitor: row.is_current_visitor }
  })
  const currentRecord = rankingRows.find((row) => row.is_current_visitor)
  const currentScore = currentRecord ? Number(currentRecord.total_score) : null
  return sendJson(response, 200, {
    syncedAt: new Date().toISOString(),
    currentRank: currentRecord ? Number(currentRecord.rank) : null,
    myRecord: currentRecord ? { score: currentScore, tier: tierForScore(currentScore) } : null,
    entries,
  })
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
    if (url.pathname === '/api/sync' && request.method === 'POST') return await syncResearch(request, response)
    if (url.pathname.startsWith('/api/')) return sendJson(response, pool ? 404 : 503, { error: pool ? 'API endpoint not found.' : 'Research storage is disabled.' })
    if (request.method === 'GET' || request.method === 'HEAD') return serveStatic(request, response)
    return sendJson(response, 405, { error: 'Method not allowed.' })
  } catch (error) {
    if (error.status) return sendJson(response, error.status, { error: error.message })
    return sendJson(response, 503, { error: 'Research storage is temporarily unavailable.' })
  }
})

const port = Number(process.env.PORT || 4173)
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(port, '0.0.0.0', () => console.log(`Chami Sugar Lab server listening on ${port}`))

  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => {
    await pool?.end().catch(() => {})
    process.exit(0)
  }))
}
