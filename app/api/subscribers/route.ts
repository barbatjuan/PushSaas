import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { site_id, token, user_agent, url } = await request.json()

    if (!site_id || !token) {
      return NextResponse.json({ error: 'Site ID and token are required' }, { status: 400 })
    }

    // Get site information and check if it's active
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('id, user_id, status, subscriber_count, users(plan)')
      .eq('site_id', site_id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (site.status !== 'active') {
      return NextResponse.json({ error: 'Site is not active' }, { status: 400 })
    }

    // Check plan limits
    const userPlan = (site.users as any)?.[0]?.plan || 'free'
    const maxSubscribers = userPlan === 'paid' ? 10000 : 500

    if (site.subscriber_count >= maxSubscribers) {
      return NextResponse.json({ error: 'Subscriber limit reached for this plan' }, { status: 400 })
    }

    // Check if subscriber already exists
    const { data: existingSubscriber, error: existingError } = await supabaseAdmin
      .from('subscribers')
      .select('id, is_active')
      .eq('site_id', site_id)
      .eq('token', token)
      .single()

    if (existingSubscriber) {
      if (!existingSubscriber.is_active) {
        // Reactivate existing subscriber
        const { error: updateError } = await supabaseAdmin
          .from('subscribers')
          .update({
            is_active: true,
            last_seen: new Date().toISOString(),
            user_agent,
          })
          .eq('id', existingSubscriber.id)

        if (updateError) {
          console.error('Error reactivating subscriber:', updateError)
          return NextResponse.json({ error: 'Error updating subscriber' }, { status: 500 })
        }
      } else {
        // Update last seen
        await supabaseAdmin
          .from('subscribers')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', existingSubscriber.id)
      }

      return NextResponse.json({ message: 'Subscriber updated successfully' })
    }

    // Create new subscriber
    const { data: newSubscriber, error: subscriberError } = await supabaseAdmin
      .from('subscribers')
      .insert({
        site_id,
        token,
        user_agent,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        subscribed_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (subscriberError) {
      console.error('Error creating subscriber:', subscriberError)
      return NextResponse.json({ error: 'Error creating subscriber' }, { status: 500 })
    }

    // Update site subscriber count
    const { error: countError } = await supabaseAdmin
      .from('sites')
      .update({
        subscriber_count: site.subscriber_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', site.id)

    if (countError) {
      console.error('Error updating subscriber count:', countError)
    }

    return NextResponse.json({ 
      message: 'Subscriber registered successfully',
      subscriber: newSubscriber 
    }, { status: 201 })
  } catch (error) {
    console.error('Error in subscribers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
