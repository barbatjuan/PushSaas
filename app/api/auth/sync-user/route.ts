import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(_req: NextRequest) {
  try {
    const clerk = await currentUser()
    if (!clerk) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const email = clerk.emailAddresses[0]?.emailAddress || ''
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    // 1) Try to find by clerk_id
    const { data: byClerk, error: byClerkErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', clerk.id)
      .maybeSingle()

    if (byClerk && !byClerkErr) {
      return NextResponse.json({ linked: true, user: byClerk })
    }

    // 2) Try to find by email and attach clerk_id (preserve role/plan)
    const { data: byEmail, error: byEmailErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (byEmailErr) {
      return NextResponse.json({ error: byEmailErr.message }, { status: 500 })
    }

    if (byEmail) {
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('users')
        .update({ clerk_id: clerk.id, name: byEmail.name || clerk.fullName || email })
        .eq('id', byEmail.id)
        .select('*')
        .single()

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
      return NextResponse.json({ linked: true, user: updated })
    }

    // 3) Create new if none exists; set role from Clerk metadata if present
    const roleFromMetadata = (clerk.publicMetadata as any)?.role === 'admin' ? 'admin' : 'user'
    const { data: created, error: createErr } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: clerk.id,
        email,
        name: clerk.fullName,
        role: roleFromMetadata,
        plan: 'free',
      })
      .select('*')
      .single()

    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })

    return NextResponse.json({ linked: true, user: created })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
