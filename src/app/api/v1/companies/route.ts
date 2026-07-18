import { supabaseAdmin } from '@/lib/supabase/admin'
import { companyCreateSchema } from '@/lib/schemas'
import { requireAuth, readJson } from '../_lib/guard'
import { ok, created, invalid, error } from '../_lib/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/v1/companies — list the caller's companies.
export async function GET(req: Request) {
  const auth = await requireAuth(req, 'crm:read')
  if (auth instanceof Response) return auth

  const { data, error: e } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('owner_id', auth.userId)
    .is('deleted_at', null)
    .order('name')
  if (e) return error('server_error', e.message, 500)
  return ok({ items: data ?? [] })
}

// POST /api/v1/companies — create a company.
export async function POST(req: Request) {
  const auth = await requireAuth(req, 'crm:write')
  if (auth instanceof Response) return auth

  const parsed = companyCreateSchema.safeParse(await readJson(req))
  if (!parsed.success) return invalid(parsed.error)

  const { data, error: e } = await supabaseAdmin
    .from('companies')
    .insert({ owner_id: auth.userId, ...parsed.data })
    .select('*')
    .single()
  if (e) {
    if (e.code === '23505') return error('conflict', 'Company name already exists', 409)
    return error('server_error', e.message, 500)
  }
  return created(data)
}
