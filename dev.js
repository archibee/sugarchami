import { spawn } from 'node:child_process'

const children = [
  spawn(process.execPath, ['--env-file-if-exists=.env.local', 'server.js'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } }),
]

let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) if (!child.killed) child.kill('SIGTERM')
  process.exitCode = code
}

for (const child of children) {
  child.on('error', () => stop(1))
  child.on('exit', (code) => { if (!stopping) stop(code || 0) })
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(0))
