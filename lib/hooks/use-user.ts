import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type User = Database['public']['Tables']['users']['Row']

export function useCurrentUser() {
  const { user: clerkUser, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !clerkUser) {
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
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', clerkUser.id)
          .single()

        if (existingUser) {
          setDbUser(existingUser)
        } else if (error?.code === 'PGRST116') {
          // No row by clerk_id. Try to link existing row by email to avoid duplicates and preserve role/plan.
          const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress || ''

          const { data: byEmail, error: emailErr } = await supabase
            .from('users')
            .select('*')
            .eq('email', primaryEmail)
            .single()

          if (byEmail && !emailErr) {
            // Update existing row to attach current clerk_id (preserve role/plan)
            const { data: updated, error: updateErr } = await supabase
              .from('users')
              .update({
                clerk_id: clerkUser.id,
                name: byEmail.name || clerkUser.fullName || byEmail.email,
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
            const roleFromMetadata = (clerkUser.publicMetadata as any)?.role === 'admin' ? 'admin' : 'user'
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                clerk_id: clerkUser.id,
                email: primaryEmail,
                name: clerkUser.fullName,
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
  }, [clerkUser, isLoaded])

  return {
    user: dbUser,
    clerkUser,
    loading: loading || !isLoaded,
    isAdmin: dbUser?.role === 'admin',
    isPaid: dbUser?.plan === 'paid',
  }
}
