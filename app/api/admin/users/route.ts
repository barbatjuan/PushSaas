import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1) Prefer DB role check
    let isAdmin = false
    try {
      const { data: dbUser, error } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('supabase_user_id', user.id)
        .single()
      if (!error && dbUser?.role === 'admin') {
        isAdmin = true
      }
    } catch (e) {
      console.error('Error checking admin role from DB:', e)
    }

    // 2) Fallback: ADMIN_PASSWORD
    if (!isAdmin) {
      const adminPassword = request.headers.get('x-admin-password') || 
                           new URL(request.url).searchParams.get('admin_password')
      if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    // Get all users (without relying on FK-based nested selects)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, plan, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // Fetch all sites and group by user_id
    const { data: sites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('id, name, url, status, subscriber_count, user_id')

    if (sitesError) throw sitesError

    const sitesByUser: Record<string, any[]> = {}
    for (const s of sites || []) {
      const key = s.user_id as unknown as string
      if (!key) continue
      if (!sitesByUser[key]) sitesByUser[key] = []
      sitesByUser[key].push({
        id: s.id,
        name: s.name,
        url: s.url,
        status: s.status,
        subscriber_count: s.subscriber_count,
      })
    }

    const enriched = (users || []).map(u => ({
      ...u,
      sites: sitesByUser[u.id] || []
    }))

    return NextResponse.json({ users: enriched })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('supabase_user_id', user.id)
      .single()

    if (userError || !dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, plan, role } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Update user
    const updateData: any = {}
    if (plan) updateData.plan = plan
    if (role) updateData.role = role

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' }, 
      { status: 500 }
    )
  }
}
