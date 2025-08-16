import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's sites
    const { data: sites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('id, name, status')
      .eq('user_id', user.id)

    if (sitesError) {
      console.error('❌ Error fetching user sites:', sitesError)
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
    }

    const bySite: Record<string, { count: number; name: string; status: string }> = {}
    let total = 0

    for (const site of sites || []) {
      try {
        const { count, error } = await supabaseAdmin
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', site.id)
          .eq('is_active', true)
        const c = error ? 0 : (count || 0)
        bySite[site.id] = { count: c, name: site.name, status: site.status || 'active' }
        total += c
      } catch (e) {
        console.error('❌ Error counting push_subscriptions for site', site.id, e)
        bySite[site.id] = { count: 0, name: site.name, status: site.status || 'active' }
      }
    }

    return NextResponse.json({ total, bySite, lastUpdated: new Date().toISOString() })
  } catch (e) {
    console.error('❌ Error in subscriber-counts API:', e)
    return NextResponse.json({ error: 'Failed to compute counts' }, { status: 500 })
  }
}
