// pages/api/clerk/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false, // Para no modificar el body en proxys
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = [] } = req.query

  const url = `https://frontend-api.clerk.dev/${(path as string[]).join('/')}`

  // Si es OPTIONS, respondemos rápido para CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Get request body for non-GET requests
  let body: string | undefined = undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise<string>((resolve) => {
      let data = ''
      req.on('data', (chunk) => {
        data += chunk
      })
      req.on('end', () => {
        resolve(data)
      })
    })
  }

  const response = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Authorization': req.headers['authorization'] || '',
      'User-Agent': req.headers['user-agent'] || '',
      'Clerk-Proxy-Url': `${process.env.NEXT_PUBLIC_SITE_URL}/__clerk`,
      'Clerk-Secret-Key': process.env.CLERK_SECRET_KEY!,
      'X-Forwarded-For':
        (req.headers['x-forwarded-for'] as string) ||
        req.socket.remoteAddress ||
        '',
    },
    body: body,
  })

  // Pasar headers de la respuesta original
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  res.status(response.status)
  const buffer = Buffer.from(await response.arrayBuffer())
  res.send(buffer)
}
