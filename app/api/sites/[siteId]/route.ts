import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId } = params

    // Get or create user in database
    let dbUser
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', user.id)
      .single()

    if (existingUser) {
      dbUser = existingUser
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if site belongs to user
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('site_id', siteId)
      .eq('user_id', dbUser.id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Delete all subscribers for this site first
    const { error: subscribersError } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('site_id', siteId)

    if (subscribersError) {
      console.error('Error deleting subscribers:', subscribersError)
      // Continue anyway, we still want to delete the site
    }

    // Delete the site
    const { error: deleteError } = await supabaseAdmin
      .from('sites')
      .delete()
      .eq('site_id', siteId)
      .eq('user_id', dbUser.id)

    if (deleteError) {
      console.error('Error deleting site:', deleteError)
      return NextResponse.json({ error: 'Error deleting site' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Site deleted successfully' })
  } catch (error) {
    console.error('Error in site DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteId } = params

    // Get or create user in database
    let dbUser
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', user.id)
      .single()

    if (existingUser) {
      dbUser = existingUser
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get site details
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('site_id', siteId)
      .eq('user_id', dbUser.id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    return NextResponse.json(site)
  } catch (error) {
    console.error('Error in site GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
