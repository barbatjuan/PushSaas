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

    // Check if user is admin
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('supabase_user_id', user.id)
      .single()

    if (userError || !dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all sites with user information
    const { data: sites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select(`
        id,
        name,
        url,
        site_id,
        status,
        subscriber_count,
        created_at,
        updated_at,
        expires_at,
        users (
          id,
          email,
          name,
          plan
        )
      `)
      .order('created_at', { ascending: false })

    if (sitesError) throw sitesError

    return NextResponse.json({ sites })

  } catch (error) {
    console.error('Error fetching sites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sites' }, 
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

    const { siteId, status, expires_at } = await request.json()

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 })
    }

    // Update site
    const updateData: any = {}
    if (status) updateData.status = status
    if (expires_at !== undefined) updateData.expires_at = expires_at

    const { data: updatedSite, error: updateError } = await supabaseAdmin
      .from('sites')
      .update(updateData)
      .eq('id', siteId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ 
      message: 'Site updated successfully',
      site: updatedSite 
    })

  } catch (error) {
    console.error('Error updating site:', error)
    return NextResponse.json(
      { error: 'Failed to update site' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { siteId } = await request.json()

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 })
    }

    // Delete site (this will cascade delete subscribers and notifications)
    const { error: deleteError } = await supabaseAdmin
      .from('sites')
      .delete()
      .eq('id', siteId)

    if (deleteError) throw deleteError

    return NextResponse.json({ 
      message: 'Site deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting site:', error)
    return NextResponse.json(
      { error: 'Failed to delete site' }, 
      { status: 500 }
    )
  }
}
