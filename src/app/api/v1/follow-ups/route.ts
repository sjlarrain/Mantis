import { supabaseAdmin } from '@/lib/supabase/admin'
import { computeDashboard } from '@/lib/dashboard-core'
import { requireAuth } from '../_lib/guard'
import { ok } from '../_lib/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/v1/follow-ups?due=today|overdue|quiet|all (default all)
// The same computation the dashboard uses, scoped to the caller.
export async function GET(req: Request) {
  const auth = await requireAuth(req, 'crm:read')
  if (auth instanceof Response) return auth

  const due = new URL(req.url).searchParams.get('due') ?? 'all'
  const dash = await computeDashboard(supabaseAdmin, auth.userId)

  switch (due) {
    case 'overdue':
      return ok({ items: dash.followUps.filter((f) => f.bucket === 'overdue') })
    case 'today':
      return ok({ items: dash.followUps.filter((f) => f.bucket === 'today') })
    case 'quiet':
      return ok({ items: dash.quiet })
    default:
      return ok({
        followUps: dash.followUps,
        quiet: dash.quiet,
        inboxCount: dash.inboxCount,
        wishlistDue: dash.wishlistDue,
      })
  }
}
