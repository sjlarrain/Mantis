import { supabaseAdmin } from '@/lib/supabase/admin'
import { inboxCreateSchema } from '@/lib/schemas'
import { authenticate } from '../_lib/auth'
import { hasScope } from '../_lib/scopes'
import { created, ok, unauthorized, forbidden, invalid } from '../_lib/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/v1/inbox — list unclassified (inbox) notes for the caller.
export async function GET(req: Request) {
  const ctx = await authenticate(req)
  if (!ctx) return unauthorized()
  if (!hasScope(ctx.scopes, 'crm:read')) return forbidden('crm:read')

  const { data, error } = await supabaseAdmin
    .from('notes')
    .select('id, body, source, source_ref, created_at')
    .eq('owner_id', ctx.userId)
    .eq('status', 'inbox')
    .order('created_at', { ascending: false })

  if (error) return invalidServer(error.message)
  return ok({ items: data ?? [] })
}

// POST /api/v1/inbox — quick-capture a note (e.g. from WhatsApp via Secretariat).
// Idempotent on (source, source_ref): a replayed webhook saves at most once.
export async function POST(req: Request) {
  const ctx = await authenticate(req)
  if (!ctx) return unauthorized()
  if (!hasScope(ctx.scopes, 'inbox:write')) return forbidden('inbox:write')

  const parsed = inboxCreateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return invalid(parsed.error)
  const { text, source, source_ref } = parsed.data

  // Idempotency: return the existing note if this source_ref was already saved.
  if (source_ref) {
    const { data: existing } = await supabaseAdmin
      .from('notes')
      .select('id')
      .eq('owner_id', ctx.userId)
      .eq('source', source)
      .eq('source_ref', source_ref)
      .maybeSingle()
    if (existing) return ok({ id: existing.id, deduped: true })
  }

  const { data, error } = await supabaseAdmin
    .from('notes')
    .insert({
      owner_id: ctx.userId,
      body: text,
      source,
      source_ref: source_ref ?? null,
      status: 'inbox',
    })
    .select('id')
    .single()

  if (error) {
    // Unique-violation race: the row was created concurrently — return it.
    if (error.code === '23505' && source_ref) {
      const { data: existing } = await supabaseAdmin
        .from('notes')
        .select('id')
        .eq('owner_id', ctx.userId)
        .eq('source', source)
        .eq('source_ref', source_ref)
        .maybeSingle()
      if (existing) return ok({ id: existing.id, deduped: true })
    }
    return invalidServer(error.message)
  }

  return created({ id: data.id })
}

function invalidServer(message: string) {
  return Response.json({ error: { code: 'server_error', message } }, { status: 500 })
}
