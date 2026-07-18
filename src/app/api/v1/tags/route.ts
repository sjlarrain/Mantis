import { supabaseAdmin } from '@/lib/supabase/admin'
import { tagCreateSchema } from '@/lib/schemas'
import { requireAuth, readJson } from '../_lib/guard'
import { ok, created, invalid, error } from '../_lib/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/v1/tags?category=…&active=true
export async function GET(req: Request) {
  const auth = await requireAuth(req, 'crm:read')
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const activeOnly = url.searchParams.get('active') === 'true'

  let q = supabaseAdmin.from('tags').select('*').eq('owner_id', auth.userId)
  if (category) q = q.eq('category', category)
  if (activeOnly) q = q.is('archived_at', null)
  const { data, error: e } = await q.order('category').order('sort_order')
  if (e) return error('server_error', e.message, 500)
  return ok({ items: data ?? [] })
}

// POST /api/v1/tags — add a catalog value (appended to its category).
export async function POST(req: Request) {
  const auth = await requireAuth(req, 'crm:write')
  if (auth instanceof Response) return auth

  const parsed = tagCreateSchema.safeParse(await readJson(req))
  if (!parsed.success) return invalid(parsed.error)

  const { data: last } = await supabaseAdmin
    .from('tags')
    .select('sort_order')
    .eq('owner_id', auth.userId)
    .eq('category', parsed.data.category)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error: e } = await supabaseAdmin
    .from('tags')
    .insert({
      owner_id: auth.userId,
      category: parsed.data.category,
      value: parsed.data.value,
      color: parsed.data.color ?? null,
      sort_order: parsed.data.sort_order ?? (last?.sort_order ?? -1) + 1,
    })
    .select('*')
    .single()
  if (e) {
    if (e.code === '23505') return error('conflict', 'That value already exists', 409)
    return error('server_error', e.message, 500)
  }
  return created(data)
}
