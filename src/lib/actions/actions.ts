'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/supabase/session'
import { actionCreateSchema } from '@/lib/schemas'
import { syncNextFollowUp } from '@/lib/followup-sync'
import type { Action } from '@/types'

// Server Actions for the event log. Each touchpoint (meeting, outreach, reply…)
// is one row; a contact's "last action" is the newest by occurred_on.

export async function listActions(contactId: string): Promise<Action[]> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('actions')
    .select('*')
    .eq('contact_id', contactId)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
  return (data ?? []) as Action[]
}

function actionFromForm(form: FormData) {
  const get = (k: string) => {
    const v = form.get(k)
    return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
  }
  return {
    contact_id: get('contact_id'),
    type_tag_id: get('type_tag_id'),
    occurred_on: get('occurred_on'),
    summary: get('summary'),
    follow_up_on: get('follow_up_on'),
  }
}

export async function createAction(form: FormData) {
  const parsed = actionCreateSchema.safeParse(actionFromForm(form))
  if (!parsed.success) return { ok: false as const, error: 'Pick a contact for this action.' }

  const { supabase, userId } = await getSession()
  const { error } = await supabase.from('actions').insert({ owner_id: userId, ...parsed.data })
  if (error) return { ok: false as const, error: error.message }

  await syncNextFollowUp(supabase, parsed.data.contact_id)
  revalidatePath(`/people/${parsed.data.contact_id}`)
  revalidatePath('/table')
  return { ok: true as const }
}

export async function completeFollowUp(actionId: string, contactId: string) {
  const { supabase } = await getSession()
  await supabase
    .from('actions')
    .update({ follow_up_done_at: new Date().toISOString() })
    .eq('id', actionId)
  await syncNextFollowUp(supabase, contactId)
  revalidatePath(`/people/${contactId}`)
  revalidatePath('/')
  return { ok: true as const }
}
