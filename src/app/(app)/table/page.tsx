import Link from 'next/link'
import { getTableRows } from '@/lib/actions/table'
import { listTags } from '@/lib/actions/tags'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, Badge } from '@/components/ui/Card'
import { formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

// The spreadsheet replica: every person with their company, class, channels, and
// most recent touchpoint in one scannable grid.
export default async function TablePage() {
  const [rows, tags] = await Promise.all([getTableRows(), listTags()])
  const tagValue = (id: string | null) => tags.find((t) => t.id === id)?.value

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Overview" title="Full table" />

      {rows.length === 0 ? (
        <EmptyState title="Nothing to show yet" hint="Add people and log actions to fill the table." />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-line">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left">
                {['Company', 'Channel', 'Class', 'Contact', 'Title', 'How I know', 'Email', 'LinkedIn', 'Last action', 'Notes'].map(
                  (h) => (
                    <th key={h} className="eyebrow whitespace-nowrap px-3 py-2 font-medium">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ contact: c, companyChannelTagId, lastActionOn, lastActionTypeId, latestNote }) => (
                <tr key={c.id} className="border-b border-line align-top hover:bg-accent-soft/50">
                  <td className="px-3 py-2">
                    {c.company ? (
                      <Link href={`/companies/${c.company.id}`} className="text-accent-ink hover:underline">
                        {c.company.name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted">{tagValue(companyChannelTagId) || '—'}</td>
                  <td className="px-3 py-2">
                    {tagValue(c.class_tag_id) ? <Badge tone="accent">{tagValue(c.class_tag_id)}</Badge> : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium">
                    <Link href={`/people/${c.id}`} className="hover:underline">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted">{c.title_free || tagValue(c.title_tag_id) || '—'}</td>
                  <td className="px-3 py-2 text-muted">{c.how_i_know || '—'}</td>
                  <td className="px-3 py-2">
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="text-accent-ink hover:underline">
                        {c.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {c.linkedin_url ? (
                      <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="text-accent-ink hover:underline">
                        Profile
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {lastActionOn ? (
                      <>
                        <span className="tnum">{formatDate(lastActionOn)}</span>
                        {tagValue(lastActionTypeId) ? ` · ${tagValue(lastActionTypeId)}` : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="max-w-[16rem] px-3 py-2 text-muted">
                    <span className="line-clamp-2">{latestNote || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
