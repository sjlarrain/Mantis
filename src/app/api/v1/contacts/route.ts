import { supabaseAdmin } from '@/lib/supabase/admin'
import { contactCreateSchema } from '@/lib/schemas'
import { mapBundleError } from '@/lib/contacts-helpers'
import { requireAuth, readJson } from '../_lib/guard'
import { ok, created, invalid, error } from '../_lib/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/v1/contacts — list contacts with their company.
export async function GET(req: Request) {
  const auth = await requireAuth(req, 'crm:read')
  if (auth instanceof Response) return auth

  const { data, error: e } = await supabaseAdmin
    .from('contacts')
    .select('*, company:companies(id, name)')
    .eq('owner_id', auth.userId)
    .is('deleted_at', null)
    .order('full_name')
  if (e) return error('server_error', e.message, 500)
  return ok({ items: data ?? [] })
}

// POST /api/v1/contacts — create a contact, creating its company inline if
// needed, plus an optional first action and note. One atomic bundle call.
export async function POST(req: Request) {
  const auth = await requireAuth(req, 'crm:write')
  if (auth instanceof Response) return auth

  const parsed = contactCreateSchema.safeParse(await readJson(req))
  if (!parsed.success) return invalid(parsed.error)
  const { company, contact, action, note } = parsed.data

  const { data, error: e } = await supabaseAdmin.rpc('create_contact_bundle', {
    p_owner: auth.userId,
    p_company: company,
    p_contact: contact,
    p_action: action ?? null,
    p_note: note ? { ...note, source: 'api' } : null,
  })
  if (e) {
    const msg = mapBundleError(e.message)
    const status = /already have a company/.test(msg) ? 409 : 422
    return error('bundle_error', msg, status)
  }
  return created(data)
}
