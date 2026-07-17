import Link from 'next/link'
import { listCompanies } from '@/lib/actions/companies'
import { listTags } from '@/lib/actions/tags'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, Badge } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const [companies, tags] = await Promise.all([listCompanies(), listTags()])
  const tagValue = (id: string | null) => tags.find((t) => t.id === id)?.value

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pipeline"
        title="Companies"
        action={{ href: '/companies/new', label: 'New company' }}
      />

      {companies.length === 0 ? (
        <EmptyState
          title="No companies yet"
          hint="Add the organizations you're targeting. People you meet get attached to them."
        />
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
          {companies.map((c) => (
            <li key={c.id}>
              <Link
                href={`/companies/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent-soft"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                {tagValue(c.priority_tag_id) && (
                  <Badge tone="accent">{tagValue(c.priority_tag_id)}</Badge>
                )}
                {tagValue(c.recruiting_channel_tag_id) && (
                  <Badge tone="neutral">{tagValue(c.recruiting_channel_tag_id)}</Badge>
                )}
                <span className="hidden w-32 truncate text-sm text-muted sm:block">
                  {c.location}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
