const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Make sure you have:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeUserAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`)
    
    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (findError) {
      console.error('❌ Error finding user:', findError.message)
      return
    }

    if (!user) {
      console.error('❌ User not found with email:', email)
      return
    }

    console.log(`✅ Found user: ${user.name || 'No name'} (${user.email})`)
    console.log(`📋 Current role: ${user.role}`)
    console.log(`💳 Current plan: ${user.plan}`)

    if (user.role === 'admin') {
      console.log('ℹ️  User is already an admin!')
      return
    }

    // Update user to admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        plan: 'paid' // Also upgrade to paid plan
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating user:', updateError.message)
      return
    }

    console.log('🎉 SUCCESS! User has been promoted to admin')
    console.log(`📋 New role: ${updatedUser.role}`)
    console.log(`💳 New plan: ${updatedUser.plan}`)
    console.log('')
    console.log('🚀 You can now access the admin dashboard at: /admin/dashboard')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide an email address')
  console.log('Usage: node scripts/make-admin.js your-email@example.com')
  process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format')
  process.exit(1)
}

console.log('🚀 PushSaaS Admin Promotion Script')
console.log('==================================')
console.log('')

makeUserAdmin(email)
