'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/supabase/session'
import { companyCreateSchema, companyUpdateSchema } from '@/lib/schemas'
import type { Company } from '@/types'

// Server Actions for companies. RLS scopes everything to the signed-in user.

export async function listCompanies(): Promise<Company[]> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('companies')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })
  return (data ?? []) as Company[]
}

export async function getCompany(id: string): Promise<Company | null> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  return (data as Company) ?? null
}

function formToInput(form: FormData) {
  const get = (k: string) => {
    const v = form.get(k)
    return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
  }
  return {
    name: get('name'),
    website: get('website'),
    industry: get('industry'),
    location: get('location'),
    description: get('description'),
    recruiting_channel_tag_id: get('recruiting_channel_tag_id'),
    priority_tag_id: get('priority_tag_id'),
    notes: get('notes'),
  }
}

export async function createCompany(form: FormData) {
  const parsed = companyCreateSchema.safeParse(formToInput(form))
  if (!parsed.success) return { ok: false as const, error: 'Please add a company name.' }

  const { supabase, userId } = await getSession()
  const { data, error } = await supabase
    .from('companies')
    .insert({ owner_id: userId, ...parsed.data })
    .select('id')
    .single()

  if (error) {
    return {
      ok: false as const,
      error: error.code === '23505' ? 'You already have a company with that name.' : error.message,
    }
  }
  revalidatePath('/companies')
  redirect(`/companies/${data.id}`)
}

export async function updateCompany(id: string, form: FormData) {
  const parsed = companyUpdateSchema.safeParse(formToInput(form))
  if (!parsed.success) return { ok: false as const, error: 'Invalid company details.' }

  const { supabase } = await getSession()
  const { error } = await supabase.from('companies').update(parsed.data).eq('id', id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/companies')
  revalidatePath(`/companies/${id}`)
  redirect(`/companies/${id}`)
}

export async function softDeleteCompany(id: string) {
  const { supabase } = await getSession()
  await supabase
    .from('companies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/companies')
  redirect('/companies')
}
