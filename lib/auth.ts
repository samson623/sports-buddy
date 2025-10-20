import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserTier, UserProfile } from '@/types/database'

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (error) return null
  return data as UserProfile
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function checkTier(required: UserTier | 'plus_or_pro') {
  const profile = await getUserProfile()
  if (!profile) return false
  if (required === 'plus_or_pro') {
    return profile.tier === 'plus' || profile.tier === 'pro'
  }
  return profile.tier === required
}