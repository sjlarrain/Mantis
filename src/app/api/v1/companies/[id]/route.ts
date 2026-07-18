import { supabaseAdmin } from '@/lib/supabase/admin'
import { companyUpdateSchema } from '@/lib/schemas'
import { requireAuth, readJson } from '../../_lib/guard'
import { ok, invalid, notFound, error } from '../../_lib/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

// GET /api/v1/companies/:id
export async function GET(req: Request, { params }: Params) {
  const auth = await requireAuth(req, 'crm:read')
  if (auth instanceof Response) return auth
  const { id } = await params

  const { data } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', id)
    .eq('owner_id', auth.userId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!data) return notFound('Company')
  return ok(data)
}

// PATCH /api/v1/companies/:id
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAuth(req, 'crm:write')
  if (auth instanceof Response) return auth
  const { id } = await params

  const parsed = companyUpdateSchema.safeParse(await readJson(req))
  if (!parsed.success) return invalid(parsed.error)

  const { data, error: e } = await supabaseAdmin
    .from('companies')
    .update(parsed.data)
    .eq('id', id)
    .eq('owner_id', auth.userId)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle()
  if (e) return error('server_error', e.message, 500)
  if (!data) return notFound('Company')
  return ok(data)
}

// DELETE /api/v1/companies/:id — soft delete.
export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireAuth(req, 'crm:write')
  if (auth instanceof Response) return auth
  const { id } = await params

  const { data } = await supabaseAdmin
    .from('companies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', auth.userId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()
  if (!data) return notFound('Company')
  return ok({ id: data.id, deleted: true })
}
