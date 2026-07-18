'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/supabase/session'
import { mintToken } from '@/lib/auth/tokens'
import { SCOPES, type Scope } from '@/app/api/v1/_lib/scopes'

export interface TokenRow {
  id: string
  name: string | null
  scopes: string[]
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

// Never selects token_hash — the raw token is shown once at creation and never
// again.
export async function listTokens(): Promise<TokenRow[]> {
  const { supabase } = await getSession()
  const { data } = await supabase
    .from('api_tokens')
    .select('id, name, scopes, last_used_at, expires_at, revoked_at, created_at')
    .order('created_at', { ascending: false })
  return (data ?? []) as TokenRow[]
}

// Returns the raw token exactly once. Store only its hash.
export async function createToken(input: {
  name: string
  scopes: Scope[]
}): Promise<{ ok: true; raw: string } | { ok: false; error: string }> {
  const scopes = input.scopes.filter((s) => (SCOPES as readonly string[]).includes(s))
  if (scopes.length === 0) return { ok: false, error: 'Pick at least one scope.' }

  const { supabase, userId } = await getSession()
  const { raw, hash } = mintToken()
  const { error } = await supabase.from('api_tokens').insert({
    owner_id: userId,
    name: input.name.trim() || 'Untitled token',
    token_hash: hash,
    scopes,
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings')
  return { ok: true, raw }
}

export async function revokeToken(id: string): Promise<{ ok: true }> {
  const { supabase } = await getSession()
  await supabase.from('api_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/settings')
  return { ok: true }
}
