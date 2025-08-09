import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin password from headers or query params
    const adminPassword = request.headers.get('x-admin-password') || 
                         new URL(request.url).searchParams.get('admin_password')
    
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all users with their sites
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        clerk_id,
        email,
        name,
        role,
        plan,
        created_at,
        updated_at,
        sites (
          id,
          name,
          url,
          status,
          subscriber_count
        )
      `)
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    return NextResponse.json({ users })

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
      .eq('clerk_id', user.id)
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
