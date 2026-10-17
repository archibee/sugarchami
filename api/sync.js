import { syncResearch } from '../server.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    return await syncResearch(request, response)
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 503
    const message = error?.status ? error.message : 'Research storage is temporarily unavailable.'
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    return response.status(status).json({ error: message })
  }
}
