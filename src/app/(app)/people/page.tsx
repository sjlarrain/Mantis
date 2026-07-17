import Link from 'next/link'
import { listContacts } from '@/lib/actions/contacts'
import { listTags } from '@/lib/actions/tags'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, Badge } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function PeoplePage() {
  const [contacts, tags] = await Promise.all([listContacts(), listTags()])
  const tagValue = (id: string | null) => tags.find((t) => t.id === id)?.value

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Network" title="People" action={{ href: '/people/new', label: 'New person' }} />

      {contacts.length === 0 ? (
        <EmptyState
          title="No people yet"
          hint="Add the contacts you're building relationships with. Each one belongs to a company."
        />
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
          {contacts.map((c) => (
            <li key={c.id}>
              <Link href={`/people/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent-soft">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.full_name}</span>
                  <span className="block truncate text-sm text-muted">
                    {c.title_free || tagValue(c.title_tag_id) || '—'}
                    {c.company ? ` · ${c.company.name}` : ''}
                  </span>
                </span>
                {tagValue(c.class_tag_id) && <Badge tone="accent">{tagValue(c.class_tag_id)}</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
