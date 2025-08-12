import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@/lib/server-auth'
 
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

    // 1) Prefer DB role check using Supabase user
    let isAdmin = false
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
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

    console.log('⚙️ Fetching system information...')

    // Check environment variables and configuration
    const systemInfo = {
      environment: process.env.NODE_ENV || 'development',
      database: 'Supabase PostgreSQL',
      
      // Check if critical environment variables are set
      adminPasswordSet: !!process.env.ADMIN_PASSWORD,
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      
      // Additional info
      version: '1.0.0',
      framework: 'Next.js 14',
      lastUpdated: new Date().toISOString()
    }

    console.log('✅ System info compiled:', {
      environment: systemInfo.environment,
      adminPassword: systemInfo.adminPasswordSet ? '✅' : '❌',
      supabase: systemInfo.supabaseConfigured ? '✅' : '❌',
      vapid: systemInfo.vapidConfigured ? '✅' : '❌'
    })

    return NextResponse.json(systemInfo)

  } catch (error) {
    console.error('❌ Error in system-info API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system information' }, 
      { status: 500 }
    )
  }
}
