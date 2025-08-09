import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
 
 // This route reads request headers; ensure it's treated as dynamic
 export const dynamic = 'force-dynamic'
 // Disable caching
 export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin password
    const adminPassword = request.headers.get('x-admin-password') || 
                         new URL(request.url).searchParams.get('admin_password')
    
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('📋 Fetching sites list...')

    // Get all sites first
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
        user_id
      `)
      .order('created_at', { ascending: false })

    if (sitesError) {
      console.error('❌ Error fetching sites:', sitesError)
      return NextResponse.json(
        { error: 'Failed to fetch sites' }, 
        { status: 500 }
      )
    }

    // Get user emails separately to avoid JOIN issues
    const userIds = sites?.map(site => site.user_id).filter(Boolean) || []
    let usersMap: Record<string, string> = {}
    
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .in('id', userIds)
      
      usersMap = users?.reduce((acc, user) => {
        acc[user.id] = user.email
        return acc
      }, {} as Record<string, string>) || {}
    }

    // Format the data for the frontend
    const formattedSites = sites?.map(site => ({
      id: site.id,
      name: site.name,
      url: site.url,
      site_id: site.site_id,
      status: site.status || 'active',
      subscriber_count: site.subscriber_count || 0,
      created_at: site.created_at,
      user_email: usersMap[site.user_id] || 'N/A'
    })) || []

    console.log(`✅ Found ${formattedSites.length} sites`)

    return NextResponse.json({
      sites: formattedSites,
      total: formattedSites.length,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in sites-list API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sites list' }, 
      { status: 500 }
    )
  }
}
