import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAuth } from '../_lib/guard'
import { ok, error } from '../_lib/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/v1/search?q=… — cross-entity search over companies, contacts, notes.
export async function GET(req: Request) {
  const auth = await requireAuth(req, 'crm:read')
  if (auth instanceof Response) return auth

  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q) return ok({ companies: [], contacts: [], notes: [] })
  const like = `%${q}%`

  const [companies, contacts, notes] = await Promise.all([
    supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('owner_id', auth.userId)
      .is('deleted_at', null)
      .ilike('name', like)
      .limit(10),
    supabaseAdmin
      .from('contacts')
      .select('id, full_name, company:companies(id, name)')
      .eq('owner_id', auth.userId)
      .is('deleted_at', null)
      .ilike('full_name', like)
      .limit(10),
    supabaseAdmin
      .from('notes')
      .select('id, body, contact_id')
      .eq('owner_id', auth.userId)
      .ilike('body', like)
      .limit(10),
  ])

  const firstErr = companies.error || contacts.error || notes.error
  if (firstErr) return error('server_error', firstErr.message, 500)

  return ok({
    companies: companies.data ?? [],
    contacts: contacts.data ?? [],
    notes: notes.data ?? [],
  })
}
