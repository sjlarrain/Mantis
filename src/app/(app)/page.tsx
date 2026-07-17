import { Card, EmptyState } from '@/components/ui/Card'

// Dashboard — the "what needs my attention" surface. Wired to real follow-up
// data in a later phase; this is the placeholder layout.
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Today</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Needs follow-up', value: '—' },
          { label: 'Gone quiet', value: '—' },
          { label: 'Inbox', value: '—' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="eyebrow">{s.label}</p>
            <p className="tnum mt-2 text-3xl text-ink">{s.value}</p>
          </Card>
        ))}
      </section>

      <section>
        <p className="eyebrow mb-3">Attention queue</p>
        <EmptyState
          title="Nothing due yet"
          hint="Once you log actions with follow-up dates, the ones due or overdue show up here."
        />
      </section>
    </div>
  )
}
