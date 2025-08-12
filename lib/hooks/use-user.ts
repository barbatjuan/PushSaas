import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/auth-context'
import { Database } from '@/lib/database.types'
import { useAuth } from '@/lib/auth-context'

type User = Database['public']['Tables']['users']['Row']

export function useCurrentUser() {
  const { user: authUser } = useAuth()
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authUser) {
      setLoading(false)
      return
    }

    const fetchOrCreateUser = async () => {
      try {
        // Ensure server-side linkage to avoid RLS issues and duplicates
        try {
          await fetch('/api/auth/sync-user', { method: 'POST' })
        } catch (e) {
          console.error('sync-user call failed (non-blocking):', e)
        }

        // First, try to get the user from our database
        const { data: existingUser, error } = await supabaseBrowser
          .from('users')
          .select('*')
          .eq('supabase_user_id', authUser.id)
          .single()

        if (existingUser) {
          setDbUser(existingUser)
        } else if (error?.code === 'PGRST116') {
          // No row by clerk_id. Try to link existing row by email to avoid duplicates and preserve role/plan.
          const primaryEmail = authUser.email ?? ''

          const { data: byEmail, error: emailErr } = await supabaseBrowser
            .from('users')
            .select('*')
            .eq('email', primaryEmail)
            .single()

          if (byEmail && !emailErr) {
            // Update existing row to attach current clerk_id (preserve role/plan)
            const { data: updated, error: updateErr } = await supabaseBrowser
              .from('users')
              .update({
                supabase_user_id: authUser.id,
                name: byEmail.name || authUser.user_metadata?.name || byEmail.email,
              })
              .eq('id', byEmail.id)
              .select('*')
              .single()

            if (updateErr) {
              console.error('Error linking user by email:', updateErr)
            } else {
              setDbUser(updated)
            }
          } else {
            // Create new user; set role from Clerk metadata if present
            const roleFromMetadata = (authUser.user_metadata as any)?.role === 'admin' ? 'admin' : 'user'
            const { data: newUser, error: createError } = await supabaseBrowser
              .from('users')
              .insert({
                supabase_user_id: authUser.id,
                email: primaryEmail,
                name: (authUser.user_metadata as any)?.name || primaryEmail,
                role: roleFromMetadata,
                plan: 'free',
              })
              .select('*')
              .single()

            if (createError) {
              console.error('Error creating user:', createError)
            } else {
              setDbUser(newUser)
            }
          }
        } else {
          console.error('Error fetching user:', error)
        }
      } catch (error) {
        console.error('Error in fetchOrCreateUser:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrCreateUser()
  }, [authUser])

  return {
    user: dbUser,
    loading,
    isAdmin: dbUser?.role === 'admin',
    isPaid: dbUser?.plan === 'paid',
  }
}
