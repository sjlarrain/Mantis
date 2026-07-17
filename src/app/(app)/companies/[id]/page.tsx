import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompany, softDeleteCompany } from '@/lib/actions/companies'
import { listTags } from '@/lib/actions/tags'
import { Button } from '@/components/ui/Button'
import { Card, Badge } from '@/components/ui/Card'
import { DeleteButton } from '@/components/DeleteButton'

export const dynamic = 'force-dynamic'

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [company, tags] = await Promise.all([getCompany(id), listTags()])
  if (!company) notFound()

  const tagValue = (tid: string | null) => tags.find((t) => t.id === tid)?.value
  const deleteAction = softDeleteCompany.bind(null, id)

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Company</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{company.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {tagValue(company.priority_tag_id) && (
              <Badge tone="accent">{tagValue(company.priority_tag_id)}</Badge>
            )}
            {tagValue(company.recruiting_channel_tag_id) && (
              <Badge tone="neutral">{tagValue(company.recruiting_channel_tag_id)}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/companies/${id}/edit`}>
            <Button size="sm" variant="secondary">Edit</Button>
          </Link>
          <DeleteButton action={deleteAction} confirm="Delete this company?" />
        </div>
      </header>

      <Card className="divide-y divide-line">
        <Field label="What they do" value={company.description} />
        <Field label="Industry" value={company.industry} />
        <Field label="Location" value={company.location} />
        <Field
          label="Website"
          value={
            company.website ? (
              <a href={company.website} target="_blank" rel="noreferrer" className="text-accent-ink underline">
                {company.website}
              </a>
            ) : null
          }
        />
        <Field label="Notes" value={company.notes} />
      </Card>

      <section>
        <p className="eyebrow mb-3">People here</p>
        <p className="text-sm text-muted">
          Add people from{' '}
          <Link href="/people/new" className="text-accent-ink underline">
            New person
          </Link>{' '}
          and attach them to {company.name}.
        </p>
      </section>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="col-span-2 text-sm text-ink">{value || <span className="text-faint">—</span>}</dd>
    </div>
  )
}
