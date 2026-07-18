'use server'

import { getSession } from '@/lib/supabase/session'
import { listContacts } from './contacts'
import type { ContactWithCompany } from './contacts'

export interface TableRow {
  contact: ContactWithCompany
  companyChannelTagId: string | null
  companyPriorityTagId: string | null
  lastActionOn: string | null
  lastActionTypeId: string | null
  latestNote: string | null
}

// One query per entity, reduced to per-contact latest in memory — avoids N+1
// while still giving the spreadsheet its "last action" and notes columns.
export async function getTableRows(): Promise<TableRow[]> {
  const { supabase } = await getSession()
  const contacts = await listContacts()

  const [{ data: actions }, { data: notes }, { data: companies }] = await Promise.all([
    supabase
      .from('actions')
      .select('contact_id, occurred_on, type_tag_id')
      .order('occurred_on', { ascending: false }),
    supabase
      .from('notes')
      .select('contact_id, body, created_at')
      .not('contact_id', 'is', null)
      .order('created_at', { ascending: false }),
    supabase.from('companies').select('id, recruiting_channel_tag_id, priority_tag_id'),
  ])

  const companyTags = new Map<string, { channel: string | null; priority: string | null }>()
  for (const co of companies ?? []) {
    companyTags.set(co.id, { channel: co.recruiting_channel_tag_id, priority: co.priority_tag_id })
  }

  const lastAction = new Map<string, { occurred_on: string; type_tag_id: string | null }>()
  for (const a of actions ?? []) {
    if (!lastAction.has(a.contact_id)) {
      lastAction.set(a.contact_id, { occurred_on: a.occurred_on, type_tag_id: a.type_tag_id })
    }
  }
  const latestNote = new Map<string, string>()
  for (const n of notes ?? []) {
    if (n.contact_id && !latestNote.has(n.contact_id)) latestNote.set(n.contact_id, n.body)
  }

  return contacts.map((contact) => {
    const la = lastAction.get(contact.id)
    const co = contact.company ? companyTags.get(contact.company.id) : undefined
    return {
      contact,
      companyChannelTagId: co?.channel ?? null,
      companyPriorityTagId: co?.priority ?? null,
      lastActionOn: la?.occurred_on ?? null,
      lastActionTypeId: la?.type_tag_id ?? null,
      latestNote: latestNote.get(contact.id) ?? null,
    }
  })
}
