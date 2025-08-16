import { NextRequest, NextResponse } from 'next/server'

// Endpoint legacy deprecado: la tabla 'subscribers' fue removida.
// Usa /api/subscribe con Web Push (tabla 'push_subscriptions').

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Endpoint deprecated. Use /api/subscribe instead.',
      details: 'La tabla legacy subscribers fue eliminada. Migra al nuevo flujo basado en push_subscriptions.'
    },
    { status: 410 }
  )
}
