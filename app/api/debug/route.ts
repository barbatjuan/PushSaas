import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      ONESIGNAL_APP_ID: !!process.env.ONESIGNAL_APP_ID,
      ONESIGNAL_REST_API_KEY: !!process.env.ONESIGNAL_REST_API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
    }

    // Check Clerk authentication
    let clerkUser = null
    let clerkError = null
    try {
      clerkUser = await currentUser()
    } catch (error) {
      clerkError = error instanceof Error ? error.message : 'Unknown Clerk error'
    }

    // Check Supabase connection
    let supabaseCheck = null
    let supabaseError = null
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data, error } = await supabase.from('users').select('count').limit(1)
      if (error) {
        supabaseError = error.message
      } else {
        supabaseCheck = 'Connected successfully'
      }
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : 'Unknown Supabase error'
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVariables: envCheck,
      clerk: {
        user: clerkUser ? { id: clerkUser.id, email: clerkUser.emailAddresses[0]?.emailAddress } : null,
        error: clerkError
      },
      supabase: {
        status: supabaseCheck,
        error: supabaseError
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
