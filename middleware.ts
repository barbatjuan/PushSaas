import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)'
])

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl
  const disableSignups = process.env.DISABLE_SIGNUPS === 'true'

  // Permitir páginas de login y debug del admin sin protección para evitar bucles
  if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/debug')) {
    return
  }

  // No interceptar el proxy de Clerk
  if (pathname.startsWith('/api/__clerk')) {
    return
  }


  // Bloquear registro si está activado por variable de entorno
  if (disableSignups && pathname.startsWith('/sign-up')) {
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    return Response.redirect(url)
  }

  if (isProtectedRoute(req)) auth().protect()
})

export const config = {
  // Excluir clerk proxy, _next y archivos estáticos
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api(?!/__clerk)|trpc)(.*)'],
}
