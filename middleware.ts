import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

// Middleware pas-through con Supabase Auth.
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const disableSignups = process.env.DISABLE_SIGNUPS === 'true'
  const res = NextResponse.next()

  // Refrescar cookies de sesión de Supabase en cada request
  try {
    const supabase = createMiddlewareClient<Database>({ req, res })
    await supabase.auth.getSession()
  } catch (e) {
    // noop: si falla, no bloquea la request
  }

  // Redirigir paths legacy a las rutas de auth actuales
  if (pathname.startsWith('/sign-in')) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    return NextResponse.redirect(url)
  }
  if (pathname.startsWith('/sign-up')) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/sign-up'
    return NextResponse.redirect(url)
  }

  if (disableSignups && pathname.startsWith('/auth/sign-up')) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    return NextResponse.redirect(url)
  }
  return res
}

export const config = {
  // Excluir /api y /trpc para no interferir con CORS/OPTIONS en endpoints de API
  matcher: ['/((?!.*\\..*|_next).*)', '/'],
}
