// pages/api/clerk/[...path].ts
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false, // No usado: proxy deshabilitado
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({
    ok: false,
    reason: 'Clerk proxy deshabilitado. Usa el dominio oficial de Clerk desde el frontend.',
  })
}
