'use server'

import { getSession } from '@/lib/supabase/session'
import { computeDashboard, type Dashboard } from '@/lib/dashboard-core'

export type { Dashboard, FollowUpRow, QuietRow } from '@/lib/dashboard-core'

// Web dashboard: run the shared computation as the signed-in user.
export async function getDashboard(): Promise<Dashboard> {
  const { supabase, userId } = await getSession()
  return computeDashboard(supabase, userId)
}
