import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(_req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const email = user.email || ''
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    // 1) Try to find by supabase_user_id
    const { data: byClerk, error: byClerkErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('supabase_user_id', user.id)
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
        .update({ supabase_user_id: user.id, name: byEmail.name || (user.user_metadata as any)?.name || email })
        .eq('id', byEmail.id)
        .select('*')
        .single()

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
      return NextResponse.json({ linked: true, user: updated })
    }

    // 3) Create new if none exists; set role from user metadata if present
    const roleFromMetadata = (user.user_metadata as any)?.role === 'admin' ? 'admin' : 'user'
    const { data: created, error: createErr } = await supabaseAdmin
      .from('users')
      .insert({
        supabase_user_id: user.id,
        email,
        name: (user.user_metadata as any)?.name || email,
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
