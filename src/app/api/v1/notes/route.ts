import { supabaseAdmin } from '@/lib/supabase/admin'
import { noteCreateSchema } from '@/lib/schemas'
import { requireAuth, readJson } from '../_lib/guard'
import { ok, created, invalid, error } from '../_lib/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/v1/notes?contact_id=… — notes, optionally for one contact.
export async function GET(req: Request) {
  const auth = await requireAuth(req, 'crm:read')
  if (auth instanceof Response) return auth

  const contactId = new URL(req.url).searchParams.get('contact_id')
  let q = supabaseAdmin.from('notes').select('*').eq('owner_id', auth.userId)
  if (contactId) q = q.eq('contact_id', contactId)
  const { data, error: e } = await q.order('created_at', { ascending: false })
  if (e) return error('server_error', e.message, 500)
  return ok({ items: data ?? [] })
}

// POST /api/v1/notes — create a note. With contact_id it's linked; without, it
// lands in the inbox for later classification.
export async function POST(req: Request) {
  const auth = await requireAuth(req, 'crm:write')
  if (auth instanceof Response) return auth

  const parsed = noteCreateSchema.safeParse(await readJson(req))
  if (!parsed.success) return invalid(parsed.error)

  const { data, error: e } = await supabaseAdmin
    .from('notes')
    .insert({
      owner_id: auth.userId,
      body: parsed.data.body,
      contact_id: parsed.data.contact_id ?? null,
      action_id: parsed.data.action_id ?? null,
      source: parsed.data.source ?? 'api',
      status: parsed.data.contact_id ? 'linked' : 'inbox',
    })
    .select('*')
    .single()
  if (e) return error('server_error', e.message, 500)
  return created(data)
}
