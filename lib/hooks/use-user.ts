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
        // First, try to get the user from our database
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', clerkUser.id)
          .single()

        if (existingUser) {
          setDbUser(existingUser)
        } else if (error?.code === 'PGRST116') {
          // User doesn't exist, create them
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              clerk_id: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress || '',
              name: clerkUser.fullName,
              role: 'user',
              plan: 'free',
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating user:', createError)
          } else {
            setDbUser(newUser)
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
