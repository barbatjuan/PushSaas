import type { NextRequest } from 'next/server'

// Middleware pas-through sin Clerk.
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const disableSignups = process.env.DISABLE_SIGNUPS === 'true'

  // Redirigir antiguo path de Clerk a nuestras nuevas rutas
  if (pathname.startsWith('/sign-in')) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    return Response.redirect(url)
  }
  if (pathname.startsWith('/sign-up')) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/sign-up'
    return Response.redirect(url)
  }

  if (disableSignups && pathname.startsWith('/auth/sign-up')) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    return Response.redirect(url)
  }
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
