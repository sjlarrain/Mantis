import Link from 'next/link'
import { Card, Badge } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

// TEMPORARY page: walks Santiago through the flows added in this pass so he can
// review the logic and flag what to change. Safe to delete once reviewed —
// remove this folder and the `/guide` entry from NAV in AppShell.tsx.
export default function GuidePage() {
  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <div className="flex items-center gap-2">
          <p className="eyebrow">How it works</p>
          <Badge tone="attention">Temporary</Badge>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Use guide</h1>
        <p className="mt-2 text-sm text-muted">
          A quick tour of the recent changes. Try each flow and tell me what to adjust —
          this page is disposable and will be removed once you’ve reviewed it.
        </p>
      </header>

      <Section
        title="Creating things is always one step away"
        points={[
          'Desktop: use the green “＋ New” button in the top bar — Meeting, Contact, or Company.',
          'Mobile: tap the floating “＋” button (bottom-right) to open the same menu.',
          'The Dashboard also has a “Quick actions” row at the top for the same three.',
        ]}
      >
        <Link href="/meetings/new" className="text-sm text-accent-ink underline">
          Try “New meeting” →
        </Link>
      </Section>

      <Section
        title="Log a meeting with someone new — without leaving the form"
        points={[
          'On “New meeting”, start typing a name in “Who did you meet?”.',
          'If they don’t exist yet, pick “Create “<name>”” — the person form opens right there.',
          'While adding the person you can also type a brand-new company name and pick “Create company”.',
          'Save the person and you land back on the meeting, with them already selected. Fill in the meeting and log it.',
        ]}
      >
        <p className="text-sm text-muted">
          Same idea everywhere: <strong>type → create</strong>. Meeting → Person → Company all chain together.
        </p>
      </Section>

      <Section
        title="Titles are created from the field, not from Settings"
        points={[
          'On any contact form, the “Title” field lets you search existing titles or type a new one.',
          'Choosing “Create title “<value>”” saves it and selects it immediately.',
          '“Title (custom, optional)” is still there for a one-off free-text title.',
        ]}
      >
        <Link href="/people/new" className="text-sm text-accent-ink underline">
          Try it on “New contact” →
        </Link>
      </Section>

      <Section
        title="The Table is a read-only overview"
        points={[
          'It’s the panoramic view of companies, people, titles and last touch — no “New person” button anymore.',
          'Create people from the “＋ New” menu, the Dashboard, or a company page instead.',
        ]}
      >
        <Link href="/table" className="text-sm text-accent-ink underline">
          Open the Table →
        </Link>
      </Section>

      <Card className="p-4">
        <p className="text-sm">
          Anything feel off — naming, placement, an extra step? Note it against these sections and
          I’ll refine. Then we delete this page.
        </p>
      </Card>
    </div>
  )
}

function Section({
  title,
  points,
  children,
}: {
  title: string
  points: string[]
  children?: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <ul className="space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted">
            <span className="mt-1 text-accent">›</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {children}
    </section>
  )
}
