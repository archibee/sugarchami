import { createServer } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
const root = fileURLToPath(new URL('.', import.meta.url))
const production = process.env.NODE_ENV === 'production'
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
      return sendJson(response, 503, { ok: false, storage: 'disabled' })
    }
    if (url.pathname.startsWith('/api/')) {
      return sendJson(response, 503, { error: 'Research storage is disabled.' })
    }
    if (request.method === 'GET' || request.method === 'HEAD') return serveStatic(request, response)
    return sendJson(response, 405, { error: 'Method not allowed.' })
  } catch (error) {
    if (error.status) return sendJson(response, error.status, { error: error.message })
    console.error('Request failed:', error.code || error.name || 'server error')
    return sendJson(response, 503, { error: 'Research storage is temporarily unavailable.' })
  }
})

const port = Number(process.env.PORT || 4173)
server.listen(port, '0.0.0.0', () => console.log(`Chami Sugar Lab server listening on ${port}`))

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)))
