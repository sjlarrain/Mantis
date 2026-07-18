'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/supabase/session'
import { wishlistCreateSchema } from '@/lib/schemas'
import type { Company } from '@/types'

export interface WishlistItem {
  id: string
  title: string
  url: string | null
  status_tag_id: string | null
  notes: string | null
  follow_up_on: string | null
  company: Pick<Company, 'id' | 'name'> | null
}

export async function listWishlist(): Promise<WishlistItem[]> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('wishlist_positions')
    .select('id, title, url, status_tag_id, notes, follow_up_on, company:companies(id, name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  // Supabase infers the embedded company as an array; a to-one FK returns a
  // single object at runtime, so normalize through unknown.
  return (data ?? []) as unknown as WishlistItem[]
}

function fromForm(form: FormData) {
  const get = (k: string) => {
    const v = form.get(k)
    return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
  }
  return {
    title: get('title'),
    company_id: get('company_id'),
    url: get('url'),
    status_tag_id: get('status_tag_id'),
    notes: get('notes'),
    follow_up_on: get('follow_up_on'),
  }
}

export async function createWishlist(form: FormData) {
  const parsed = wishlistCreateSchema.safeParse(fromForm(form))
  if (!parsed.success) return { ok: false as const, error: 'Add a position title.' }

  const { supabase, userId } = await getSession()
  const { error } = await supabase.from('wishlist_positions').insert({ owner_id: userId, ...parsed.data })
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/wishlist')
  return { ok: true as const }
}

export async function setWishlistStatus(id: string, statusTagId: string | null) {
  const { supabase } = await getSession()
  await supabase.from('wishlist_positions').update({ status_tag_id: statusTagId }).eq('id', id)
  revalidatePath('/wishlist')
  return { ok: true as const }
}

export async function deleteWishlist(id: string) {
  const { supabase } = await getSession()
  await supabase
    .from('wishlist_positions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/wishlist')
  return { ok: true as const }
}
