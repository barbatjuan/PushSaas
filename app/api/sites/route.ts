import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

async function ensureUserExists(clerkUser: any) {
  // Try to get existing user
  const { data: existingUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', clerkUser.id)
    .single()

  if (existingUser) {
    return existingUser
  }

  // Create user if doesn't exist
  const { data: newUser, error: createError } = await supabaseAdmin
    .from('users')
    .insert({
      clerk_id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: clerkUser.firstName && clerkUser.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}` 
        : clerkUser.username || 'User',
      plan: 'free'
    })
    .select()
    .single()
  
  if (createError) {
    console.error('Error creating user:', createError)
    throw new Error('Failed to create user: ' + createError.message)
  }
  
  return newUser
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, url } = await request.json()

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
    const dbUser = await ensureUserExists(user)

    // Check if user already has a site with this URL
    const { data: existingSite } = await supabaseAdmin
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

    // Create OneSignal app for this site (REQUIRED for notifications to work)
    let onesignalAppId = null
    let onesignalError = null
    
    try {
      console.log('Creating OneSignal app for:', name, url)
      
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

      const responseText = await onesignalResponse.text()
      console.log('OneSignal response status:', onesignalResponse.status)
      console.log('OneSignal response:', responseText)

      if (onesignalResponse.ok) {
        const onesignalData = JSON.parse(responseText)
        onesignalAppId = onesignalData.id
        console.log('OneSignal app created successfully:', onesignalAppId)
      } else {
        onesignalError = `OneSignal API error (${onesignalResponse.status}): ${responseText}`
        console.error('Failed to create OneSignal app:', onesignalError)
      }
    } catch (error) {
      onesignalError = `OneSignal exception: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('Error creating OneSignal app:', onesignalError)
    }

    // If OneSignal creation failed, return error (don't create incomplete site)
    if (!onesignalAppId) {
      return NextResponse.json({ 
        error: 'Failed to create OneSignal app for notifications', 
        details: onesignalError,
        suggestion: 'Please check OneSignal API credentials and try again'
      }, { status: 500 })
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
    console.error('Error in sites POST API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user in database
    const dbUser = await ensureUserExists(user)

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

    return NextResponse.json(sites || [])
  } catch (error) {
    console.error('Error in sites GET API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
