import { supabaseAdmin } from '@/lib/supabase/admin'
import { actionCreateSchema } from '@/lib/schemas'
import { syncNextFollowUp } from '@/lib/followup-sync'
import { requireAuth, readJson } from '../_lib/guard'
import { ok, created, invalid, error } from '../_lib/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/v1/actions?contact_id=… — actions for a contact (newest first).
export async function GET(req: Request) {
  const auth = await requireAuth(req, 'crm:read')
  if (auth instanceof Response) return auth

  const contactId = new URL(req.url).searchParams.get('contact_id')
  let q = supabaseAdmin.from('actions').select('*').eq('owner_id', auth.userId)
  if (contactId) q = q.eq('contact_id', contactId)
  const { data, error: e } = await q.order('occurred_on', { ascending: false })
  if (e) return error('server_error', e.message, 500)
  return ok({ items: data ?? [] })
}

// POST /api/v1/actions — log a touchpoint. The contact must belong to the caller.
export async function POST(req: Request) {
  const auth = await requireAuth(req, 'crm:write')
  if (auth instanceof Response) return auth

  const parsed = actionCreateSchema.safeParse(await readJson(req))
  if (!parsed.success) return invalid(parsed.error)

  // Verify the contact is the caller's before inserting.
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id')
    .eq('id', parsed.data.contact_id)
    .eq('owner_id', auth.userId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!contact) return error('not_found', 'Contact not found', 404)

  const { data, error: e } = await supabaseAdmin
    .from('actions')
    .insert({ owner_id: auth.userId, ...parsed.data, source: parsed.data.source ?? 'api' })
    .select('*')
    .single()
  if (e) return error('server_error', e.message, 500)

  await syncNextFollowUp(supabaseAdmin, parsed.data.contact_id, auth.userId)
  return created(data)
}
