// Minimal shim to replace @clerk/nextjs/server usages with Supabase Auth
import type { NextRequest } from 'next/server'
import { currentUser as supaCurrentUser, requireUser as supaRequireUser } from '@/lib/server-auth'

export async function currentUser() {
  return await supaCurrentUser()
}

export function auth() {
  return {
    async protect() {
      const res = await supaRequireUser()
      if (res) throw new Response('Unauthorized', { status: 401 })
    },
  }
}

// No-op used only in old middleware; avoid breaking imports if any remain
export function createRouteMatcher(_patterns: string[]) {
  return (_req: NextRequest) => false
}

export function clerkMiddleware(handler: (auth: any, req: NextRequest) => any) {
  return (req: NextRequest) => handler(auth as any, req)
}
