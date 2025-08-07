import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    console.log('💰 Calculating SaaS metrics...')

    // Plan pricing (you can adjust these or make them configurable)
    const PLAN_PRICING = {
      'free': 0,
      'basic': 9.99,
      'pro': 29.99,
      'enterprise': 99.99
    }

    // Get current month dates
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // 1. Get all users with their plans
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, plan, created_at')

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
    }

    const totalUsers = users?.length || 0
    const paidUsers = users?.filter(u => u.plan && u.plan !== 'free').length || 0
    const freeUsers = totalUsers - paidUsers

    // 2. Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0
    const planBreakdown: Array<{plan: string, users: number, revenue: number, percentage: number}> = []
    
    const planCounts = users?.reduce((acc, user) => {
      const plan = user.plan || 'free'
      acc[plan] = (acc[plan] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    Object.entries(planCounts).forEach(([plan, count]) => {
      const price = PLAN_PRICING[plan as keyof typeof PLAN_PRICING] || 0
      const revenue = count * price
      mrr += revenue
      
      planBreakdown.push({
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        users: count,
        revenue,
        percentage: 0 // Will calculate after we have total
      })
    })

    // Calculate percentages for plan breakdown
    planBreakdown.forEach(plan => {
      plan.percentage = mrr > 0 ? (plan.revenue / mrr) * 100 : 0
    })

    // 3. Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12

    // 4. Calculate ARPU (Average Revenue Per User)
    const arpu = paidUsers > 0 ? mrr / paidUsers : 0

    // 5. Calculate growth metrics
    const newUsersThisMonth = users?.filter(u => 
      new Date(u.created_at) >= currentMonth
    ).length || 0

    const usersLastMonth = users?.filter(u => 
      new Date(u.created_at) < currentMonth
    ).length || 0

    const userGrowthRate = usersLastMonth > 0 ? 
      ((totalUsers - usersLastMonth) / usersLastMonth) * 100 : 0

    // 6. Calculate conversion rate (simplified)
    const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0

    // 7. Calculate churn rate (simplified - users who haven't been active)
    // For now, we'll use a placeholder calculation
    const churnRate = 2.5 // Placeholder - you can implement proper churn calculation

    // 8. Calculate LTV (Customer Lifetime Value)
    // LTV = ARPU / Churn Rate (monthly)
    const monthlyChurnRate = churnRate / 100
    const ltv = monthlyChurnRate > 0 ? arpu / monthlyChurnRate : arpu * 24 // fallback to 2 years

    // 9. Calculate MRR growth (simplified)
    // For now, we'll simulate based on new users
    const previousMrr = mrr * 0.9 // Placeholder - implement proper historical tracking
    const mrrGrowthRate = previousMrr > 0 ? ((mrr - previousMrr) / previousMrr) * 100 : 0

    // Compile all metrics
    const metrics = {
      // Revenue Metrics
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      previousMrr: Math.round(previousMrr * 100) / 100,
      mrrGrowthRate: Math.round(mrrGrowthRate * 100) / 100,
      
      // User Metrics
      totalUsers,
      paidUsers,
      freeUsers,
      newUsersThisMonth,
      churnedUsersThisMonth: 0, // Placeholder
      
      // Financial Metrics
      arpu: Math.round(arpu * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      
      // Plan Breakdown
      planBreakdown: planBreakdown.sort((a, b) => b.revenue - a.revenue),
      
      // Growth Metrics
      monthlyGrowth: Math.round(mrrGrowthRate * 100) / 100,
      userGrowthRate: Math.round(userGrowthRate * 100) / 100,
      
      lastUpdated: new Date().toISOString()
    }

    console.log('✅ SaaS metrics calculated:', {
      mrr: `€${metrics.mrr}`,
      arr: `€${metrics.arr}`,
      totalUsers: metrics.totalUsers,
      paidUsers: metrics.paidUsers,
      conversionRate: `${metrics.conversionRate}%`,
      churnRate: `${metrics.churnRate}%`
    })

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('❌ Error calculating SaaS metrics:', error)
    return NextResponse.json(
      { error: 'Failed to calculate SaaS metrics' }, 
      { status: 500 }
    )
  }
}
