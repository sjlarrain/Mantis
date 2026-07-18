import type { SupabaseClient } from '@supabase/supabase-js'

// Keep contacts.next_follow_up_date in sync with the soonest OPEN follow-up on
// the contact's actions (or null). Shared by the web Server Actions (session
// client) and the REST API (service-role client). API callers must pass ownerId
// so the write stays scoped; the session client relies on RLS and passes none.
export async function syncNextFollowUp(
  client: SupabaseClient,
  contactId: string,
  ownerId?: string
): Promise<void> {
  const { data } = await client
    .from('actions')
    .select('follow_up_on')
    .eq('contact_id', contactId)
    .is('follow_up_done_at', null)
    .not('follow_up_on', 'is', null)
    .order('follow_up_on', { ascending: true })
    .limit(1)
    .maybeSingle()

  let q = client.from('contacts').update({ next_follow_up_date: data?.follow_up_on ?? null }).eq('id', contactId)
  if (ownerId) q = q.eq('owner_id', ownerId)
  await q
}
