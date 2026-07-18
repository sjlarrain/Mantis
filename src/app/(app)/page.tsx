import Link from 'next/link'
import { getDashboard } from '@/lib/actions/dashboard'
import { Card, Badge, EmptyState } from '@/components/ui/Card'
import { CREATE_ACTIONS } from '@/components/create-actions'
import { formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

// "What needs my attention": due/overdue follow-ups, contacts gone quiet, and
// inbox + wishlist reminders.
export default async function DashboardPage() {
  const { followUps, quiet, inboxCount, wishlistDue } = await getDashboard()

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Today</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
      </header>

      <section>
        <p className="eyebrow mb-3">Quick actions</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CREATE_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:border-line-strong">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                  {a.glyph}
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">{a.label}</span>
                  <span className="block text-xs text-muted">{a.hint}</span>
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Needs follow-up" value={followUps.length} href="#followups" />
        <Stat label="Gone quiet" value={quiet.length} href="#quiet" />
        <Stat label="Inbox" value={inboxCount} href="/notes" />
      </section>

      <section id="followups">
        <p className="eyebrow mb-3">Follow-ups due</p>
        {followUps.length === 0 ? (
          <EmptyState title="Nothing due" hint="Follow-up dates you set on actions show up here when they come due." />
        ) : (
          <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
            {followUps.map((f) => (
              <li key={f.contactId}>
                <Link href={`/people/${f.contactId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent-soft">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{f.name}</span>
                    {f.companyName && <span className="block truncate text-sm text-muted">{f.companyName}</span>}
                  </span>
                  <Badge tone={f.bucket === 'overdue' ? 'attention' : 'accent'}>
                    {f.bucket === 'overdue' ? 'Overdue' : 'Today'} · {formatDate(f.date)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="quiet">
        <p className="eyebrow mb-3">Gone quiet</p>
        {quiet.length === 0 ? (
          <EmptyState title="Everyone's warm" hint="Contacts with no recent touchpoint (by their class) surface here." />
        ) : (
          <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
            {quiet.map((q) => (
              <li key={q.contactId}>
                <Link href={`/people/${q.contactId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent-soft">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{q.name}</span>
                    {q.companyName && <span className="block truncate text-sm text-muted">{q.companyName}</span>}
                  </span>
                  {q.classValue && <Badge tone="neutral">{q.classValue}</Badge>}
                  <span className="tnum whitespace-nowrap text-sm text-muted">
                    {q.daysQuiet === null ? 'no activity' : `${q.daysQuiet}d quiet`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {wishlistDue.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Wishlist reminders</p>
          <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
            {wishlistDue.map((w) => (
              <li key={w.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate">{w.title}</span>
                <Badge tone="attention">{formatDate(w.date)}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="p-4 transition-colors hover:border-line-strong">
        <p className="eyebrow">{label}</p>
        <p className="tnum mt-2 text-3xl text-ink">{value}</p>
      </Card>
    </Link>
  )
}
