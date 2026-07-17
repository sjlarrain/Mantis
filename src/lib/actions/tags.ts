'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/supabase/session'
import { tagCreateSchema } from '@/lib/schemas'
import type { Tag, TagCategory } from '@/types'

// Server Actions for the Settings Tag Manager. All run as the signed-in user, so
// RLS scopes every read/write to their own tags.

export async function listTags(): Promise<Tag[]> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('tags')
    .select('id, category, value, color, sort_order, archived_at')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
  return (data ?? []) as Tag[]
}

// Active (non-archived) tags for a category — used to populate form pickers.
export async function getTagsByCategory(category: TagCategory): Promise<Tag[]> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('tags')
    .select('id, category, value, color, sort_order, archived_at')
    .eq('category', category)
    .is('archived_at', null)
    .order('sort_order', { ascending: true })
  return (data ?? []) as Tag[]
}

export async function createTag(input: {
  category: TagCategory
  value: string
  color?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = tagCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid tag' }

  const { supabase, userId } = await getSession()
  // Place new tag at the end of its category.
  const { data: last } = await supabase
    .from('tags')
    .select('sort_order')
    .eq('category', parsed.data.category)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('tags').insert({
    owner_id: userId,
    category: parsed.data.category,
    value: parsed.data.value,
    color: parsed.data.color ?? null,
    sort_order: (last?.sort_order ?? -1) + 1,
  })

  if (error) {
    return { ok: false, error: error.code === '23505' ? 'That value already exists' : error.message }
  }
  revalidatePath('/settings')
  return { ok: true }
}

export async function renameTag(
  id: string,
  value: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!value.trim()) return { ok: false, error: 'Value required' }
  const { supabase } = await getSession()
  const { error } = await supabase.from('tags').update({ value: value.trim() }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/settings')
  return { ok: true }
}

// Archive (soft) rather than delete, so existing companies/contacts referencing
// the tag keep their label. Archived tags are hidden from pickers.
export async function setTagArchived(id: string, archived: boolean): Promise<{ ok: true }> {
  const { supabase } = await getSession()
  await supabase
    .from('tags')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
  revalidatePath('/settings')
  return { ok: true }
}
