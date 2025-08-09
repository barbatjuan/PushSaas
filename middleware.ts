import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)'
])

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl
  // Permitir páginas de login y debug del admin sin protección para evitar bucles
  if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/debug')) {
    return
  }
  if (isProtectedRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
