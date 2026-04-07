import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getServerUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAuth() {
  const user = await getServerUser()
  if (!user) redirect('/login')
  return user
}
