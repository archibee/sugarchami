import { createServer } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
const root = fileURLToPath(new URL('.', import.meta.url))
const production = process.env.NODE_ENV === 'production'
const maxBodyBytes = 4096
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
