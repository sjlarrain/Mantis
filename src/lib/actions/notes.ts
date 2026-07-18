'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/supabase/session'
import type { Note } from '@/types'

// Server Actions for notes. A note with status='inbox' and no contact is a jot
// awaiting classification; classifying links it to a person and flips it to
// 'linked', where it surfaces on that person's timeline.

export async function listInboxNotes(): Promise<Note[]> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('notes')
    .select('*')
    .eq('status', 'inbox')
    .order('created_at', { ascending: false })
  return (data ?? []) as Note[]
}

export type NoteWithContact = Note & { contact: { id: string; full_name: string } | null }

export async function listAllNotes(): Promise<NoteWithContact[]> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('notes')
    .select('*, contact:contacts(id, full_name)')
    .order('created_at', { ascending: false })
  return (data ?? []) as NoteWithContact[]
}

export async function listNotesForContact(contactId: string): Promise<Note[]> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('notes')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Note[]
}

// Quick capture from the app. With a contact it's linked; without, it lands in
// the inbox for later classification.
export async function createNote(input: { body: string; contactId?: string }) {
  const body = input.body.trim()
  if (!body) return { ok: false as const, error: 'Note is empty.' }

  const { supabase, userId } = await getSession()
  const { error } = await supabase.from('notes').insert({
    owner_id: userId,
    body,
    contact_id: input.contactId ?? null,
    status: input.contactId ? 'linked' : 'inbox',
    source: 'app',
  })
  if (error) return { ok: false as const, error: error.message }

  if (input.contactId) revalidatePath(`/people/${input.contactId}`)
  revalidatePath('/notes')
  return { ok: true as const }
}

// Link an inbox note to a contact.
export async function classifyNote(noteId: string, contactId: string) {
  if (!contactId) return { ok: false as const, error: 'Pick a person.' }
  const { supabase } = await getSession()
  const { error } = await supabase
    .from('notes')
    .update({ contact_id: contactId, status: 'linked' })
    .eq('id', noteId)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/notes')
  revalidatePath(`/people/${contactId}`)
  return { ok: true as const }
}

export async function deleteNote(noteId: string) {
  const { supabase } = await getSession()
  await supabase.from('notes').delete().eq('id', noteId)
  revalidatePath('/notes')
  return { ok: true as const }
}
