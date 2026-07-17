'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/supabase/session'
import { contactCoreSchema } from '@/lib/schemas'
import { resolveCompanyRef, mapBundleError } from '@/lib/contacts-helpers'
import type { Contact, Company } from '@/types'

export type ContactWithCompany = Contact & { company: Pick<Company, 'id' | 'name'> | null }

export async function listContacts(): Promise<ContactWithCompany[]> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('contacts')
    .select('*, company:companies(id, name)')
    .is('deleted_at', null)
    .order('full_name', { ascending: true })
  return (data ?? []) as ContactWithCompany[]
}

export async function getContact(id: string): Promise<ContactWithCompany | null> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('contacts')
    .select('*, company:companies(id, name)')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  return (data as ContactWithCompany) ?? null
}

function contactFromForm(form: FormData) {
  const get = (k: string) => {
    const v = form.get(k)
    return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
  }
  return {
    full_name: get('full_name'),
    title_tag_id: get('title_tag_id'),
    title_free: get('title_free'),
    class_tag_id: get('class_tag_id'),
    how_i_know: get('how_i_know'),
    email: get('email'),
    phone: get('phone'),
    linkedin_url: get('linkedin_url'),
  }
}

// Create a contact, creating its company inline if needed — one atomic call to
// create_contact_bundle so a person can never be saved without a company.
export async function createContact(form: FormData) {
  const contact = contactFromForm(form)
  const parsed = contactCoreSchema.safeParse(contact)
  if (!parsed.success) return { ok: false as const, error: 'Please add the person’s name.' }

  const existingCompanyId = form.get('company_id')
  const newCompanyName = form.get('new_company_name')
  const company = resolveCompanyRef(
    typeof existingCompanyId === 'string' ? existingCompanyId : null,
    typeof newCompanyName === 'string' ? newCompanyName : null
  )
  if (!company) return { ok: false as const, error: 'Pick a company or add a new one.' }

  const { supabase, userId } = await getSession()
  const { data, error } = await supabase.rpc('create_contact_bundle', {
    p_owner: userId,
    p_company: company,
    p_contact: contact,
    p_action: null,
    p_note: null,
  })

  if (error) return { ok: false as const, error: mapBundleError(error.message) }

  revalidatePath('/people')
  revalidatePath('/companies')
  redirect(`/people/${(data as { contact_id: string }).contact_id}`)
}


export async function updateContact(id: string, form: FormData) {
  const parsed = contactCoreSchema.partial().safeParse(contactFromForm(form))
  if (!parsed.success) return { ok: false as const, error: 'Invalid contact details.' }

  const { supabase } = await getSession()
  const { error } = await supabase.from('contacts').update(parsed.data).eq('id', id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/people')
  revalidatePath(`/people/${id}`)
  redirect(`/people/${id}`)
}

export async function softDeleteContact(id: string) {
  const { supabase } = await getSession()
  await supabase.from('contacts').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/people')
  redirect('/people')
}
