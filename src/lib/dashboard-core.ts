import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isQuiet,
  followUpBucket,
  classKeyFromValue,
  daysBetween,
  DEFAULT_QUIET_THRESHOLDS,
  type ContactClass,
  type FollowUpBucket,
} from '@/lib/followups'

export interface FollowUpRow {
  contactId: string
  name: string
  companyName: string | null
  date: string
  bucket: FollowUpBucket
}
export interface QuietRow {
  contactId: string
  name: string
  companyName: string | null
  classValue: string | null
  lastActionOn: string | null
  daysQuiet: number | null
}
export interface Dashboard {
  followUps: FollowUpRow[]
  quiet: QuietRow[]
  inboxCount: number
  wishlistDue: { id: string; title: string; date: string }[]
}

// Compute the "needs attention" dashboard for one owner. Owner is filtered
// explicitly so this is correct with either the RLS session client or the
// service-role client (used by the API).
export async function computeDashboard(
  client: SupabaseClient,
  ownerId: string,
  now: Date = new Date()
): Promise<Dashboard> {
  const todayIso = now.toISOString().slice(0, 10)

  const [profile, classTags, companies, followUpContacts, lastActions, inbox, wishlist] =
    await Promise.all([
      client.from('user_profiles').select('settings').eq('id', ownerId).maybeSingle(),
      client.from('tags').select('id, value').eq('owner_id', ownerId).eq('category', 'contact_class'),
      client.from('companies').select('id, name').eq('owner_id', ownerId).is('deleted_at', null),
      client
        .from('contacts')
        .select('id, full_name, company_id, class_tag_id, next_follow_up_date')
        .eq('owner_id', ownerId)
        .is('deleted_at', null)
        .not('next_follow_up_date', 'is', null),
      client
        .from('contact_last_action')
        .select('contact_id, full_name, company_id, class_tag_id, last_action_on')
        .eq('owner_id', ownerId),
      client
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', ownerId)
        .eq('status', 'inbox'),
      client
        .from('wishlist_positions')
        .select('id, title, follow_up_on')
        .eq('owner_id', ownerId)
        .is('deleted_at', null)
        .not('follow_up_on', 'is', null)
        .lte('follow_up_on', todayIso),
    ])

  const thresholds =
    (profile.data?.settings?.quiet_thresholds as Record<ContactClass, number>) ??
    DEFAULT_QUIET_THRESHOLDS
  const companyName = new Map((companies.data ?? []).map((c) => [c.id, c.name]))
  const classValue = new Map((classTags.data ?? []).map((t) => [t.id, t.value]))

  const followUps: FollowUpRow[] = (followUpContacts.data ?? [])
    .map((c) => ({
      contactId: c.id,
      name: c.full_name,
      companyName: c.company_id ? companyName.get(c.company_id) ?? null : null,
      date: c.next_follow_up_date as string,
      bucket: followUpBucket(new Date(c.next_follow_up_date + 'T00:00:00'), now),
    }))
    .filter((r) => r.bucket !== 'upcoming')
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const quiet: QuietRow[] = (lastActions.data ?? [])
    .map((c) => {
      const value = c.class_tag_id ? classValue.get(c.class_tag_id) ?? null : null
      const last = c.last_action_on ? new Date(c.last_action_on + 'T00:00:00') : null
      return {
        contactId: c.contact_id,
        name: c.full_name,
        companyName: c.company_id ? companyName.get(c.company_id) ?? null : null,
        classValue: value,
        lastActionOn: c.last_action_on as string | null,
        daysQuiet: last ? daysBetween(last, now) : null,
        _quiet: isQuiet(last, classKeyFromValue(value), now, thresholds),
      }
    })
    .filter((r) => r._quiet)
    .sort((a, b) => (b.daysQuiet ?? Infinity) - (a.daysQuiet ?? Infinity))
    .map(({ _quiet, ...row }) => row)

  return {
    followUps,
    quiet,
    inboxCount: inbox.count ?? 0,
    wishlistDue: (wishlist.data ?? []).map((w) => ({
      id: w.id,
      title: w.title,
      date: w.follow_up_on as string,
    })),
  }
}
