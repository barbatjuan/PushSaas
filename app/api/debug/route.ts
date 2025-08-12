import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
    }

    // Check Supabase authentication
    const supaUser = await currentUser().catch(() => null)

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
      auth: {
        user: supaUser ? { id: supaUser.id, email: supaUser.email } : null,
        provider: 'supabase'
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
