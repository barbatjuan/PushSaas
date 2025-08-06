import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, url, user_id } = await request.json()

    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

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
      // Create user if doesn't exist
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'User'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 })
      }
      dbUser = newUser
    }

    // Check if user already has a site with this URL
    const { data: existingSite, error: existingError } = await supabaseAdmin
      .from('sites')
      .select('id')
      .eq('user_id', dbUser.id)
      .eq('url', url)
      .single()

    if (existingSite) {
      return NextResponse.json({ error: 'Ya tienes un sitio registrado con esta URL' }, { status: 400 })
    }

    // Generate unique site_id
    const siteId = uuidv4().replace(/-/g, '').substring(0, 12)

    // Create OneSignal app for this site
    let onesignalAppId = null
    try {
      const onesignalResponse = await fetch('https://onesignal.com/api/v1/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          name: `${name} - ${siteId}`,
          apns_env: 'production',
          chrome_web_origin: url,
          chrome_web_default_notification_icon: `${process.env.NEXT_PUBLIC_APP_URL}/icon-192.png`,
          chrome_web_sub_domain: null,
          site_name: name
        })
      })

      if (onesignalResponse.ok) {
        const onesignalData = await onesignalResponse.json()
        onesignalAppId = onesignalData.id
      } else {
        console.error('Failed to create OneSignal app:', await onesignalResponse.text())
      }
    } catch (error) {
      console.error('Error creating OneSignal app:', error)
    }

    // Create site in database
    const { data: newSite, error: siteError } = await supabaseAdmin
      .from('sites')
      .insert({
        user_id: dbUser.id,
        name,
        url,
        site_id: siteId,
        onesignal_app_id: onesignalAppId,
        status: 'active',
        subscriber_count: 0
      })
      .select()
      .single()

    if (siteError) {
      console.error('Error creating site:', siteError)
      return NextResponse.json({ error: 'Error creating site' }, { status: 500 })
    }

    return NextResponse.json(newSite, { status: 201 })
  } catch (error) {
    console.error('Error in sites API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      // Create user if doesn't exist
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'User'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 })
      }
      dbUser = newUser
    }

    // Get user's sites
    const { data: sites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('user_id', dbUser.id)
      .order('created_at', { ascending: false })

    if (sitesError) {
      console.error('Error fetching sites:', sitesError)
      return NextResponse.json({ error: 'Error fetching sites' }, { status: 500 })
    }

    return NextResponse.json(sites)
  } catch (error) {
    console.error('Error in sites GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
