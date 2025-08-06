import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // Test 1: Basic connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Supabase connection failed',
        details: testError.message,
        code: testError.code,
        hint: testError.hint
      })
    }

    // Test 2: Check if we can create a test user (then delete it)
    const testUserId = 'test_' + Date.now()
    const { data: createData, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        plan: 'free'
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({
        success: false,
        error: 'Cannot create user in Supabase',
        details: createError.message,
        code: createError.code,
        hint: createError.hint
      })
    }

    // Clean up test user
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('clerk_id', testUserId)

    return NextResponse.json({
      success: true,
      message: 'Supabase connection and user creation working correctly',
      testUser: createData
    })

  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Exception during Supabase test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
