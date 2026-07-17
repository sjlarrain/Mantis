import { redirect } from 'next/navigation'
import { createClient } from './server'

// Helper for Server Actions and Server Components: returns the signed-in user's
// id alongside a session-scoped Supabase client (RLS confines it to that user).
// Redirects to /login if there is no session.
export async function getSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}
