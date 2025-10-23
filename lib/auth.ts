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
    .select('id, display_name, favorite_team_id, tier, stripe_customer_id, stripe_subscription_id, qna_quota_used, qna_quota_reset_at, created_at, updated_at')
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
  const tier = await getUserTier()
  if (!tier) return false
  if (required === 'plus_or_pro') {
    return tier === 'plus' || tier === 'pro'
  }
  return tier === required
}

export async function getUserTier(): Promise<UserTier | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('user_profiles')
    .select('tier')
    .eq('id', user.id)
    .maybeSingle()
  if (error || !data) return null
  return (data as { tier: UserTier }).tier
}