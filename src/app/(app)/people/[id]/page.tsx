import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getContact, softDeleteContact } from '@/lib/actions/contacts'
import { listActions } from '@/lib/actions/actions'
import { listNotesForContact } from '@/lib/actions/notes'
import { listTags, getTagsByCategory } from '@/lib/actions/tags'
import { buildTimeline } from '@/lib/timeline'
import { Button } from '@/components/ui/Button'
import { Card, Badge } from '@/components/ui/Card'
import { DeleteButton } from '@/components/DeleteButton'
import { Timeline } from '@/components/Timeline'
import { LogActionForm } from '@/components/forms/LogActionForm'
import { AddNoteForm } from '@/components/forms/AddNoteForm'

export const dynamic = 'force-dynamic'

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [contact, tags, actionTypeTags, actions, notes] = await Promise.all([
    getContact(id),
    listTags(),
    getTagsByCategory('action_type'),
    listActions(id),
    listNotesForContact(id),
  ])
  if (!contact) notFound()

  const tagValue = (tid: string | null) => tags.find((t) => t.id === tid)?.value
  const title = contact.title_free || tagValue(contact.title_tag_id)
  const deleteAction = softDeleteContact.bind(null, id)
  const timeline = buildTimeline(actions, notes)

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Person</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{contact.full_name}</h1>
          <p className="mt-1 text-sm text-muted">
            {title}
            {contact.company && (
              <>
                {title ? ' · ' : ''}
                <Link href={`/companies/${contact.company.id}`} className="text-accent-ink underline">
                  {contact.company.name}
                </Link>
              </>
            )}
          </p>
          {tagValue(contact.class_tag_id) && (
            <div className="mt-2">
              <Badge tone="accent">{tagValue(contact.class_tag_id)}</Badge>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/people/${id}/edit`}>
            <Button size="sm" variant="secondary">Edit</Button>
          </Link>
          <DeleteButton action={deleteAction} confirm="Delete this person?" />
        </div>
      </header>

      <Card className="divide-y divide-line">
        <Channel label="Email" value={contact.email} href={contact.email ? `mailto:${contact.email}` : null} />
        <Channel label="Phone" value={contact.phone} href={contact.phone ? `tel:${contact.phone}` : null} />
        <Channel label="LinkedIn" value={contact.linkedin_url} href={contact.linkedin_url} external />
        <div className="grid grid-cols-3 gap-4 px-4 py-3">
          <dt className="text-sm text-muted">How I know them</dt>
          <dd className="col-span-2 text-sm">{contact.how_i_know || <span className="text-faint">—</span>}</dd>
        </div>
      </Card>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Log a touchpoint</p>
          <LogActionForm contactId={id} typeTags={actionTypeTags} />
          <div className="mt-4">
            <AddNoteForm contactId={id} />
          </div>
        </div>
        <div>
          <p className="eyebrow mb-3">Activity</p>
          <Timeline items={timeline} tagValue={tagValue} />
        </div>
      </section>
    </div>
  )
}

function Channel({
  label,
  value,
  href,
  external,
}: {
  label: string
  value: string | null
  href: string | null
  external?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-4 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="col-span-2 truncate text-sm">
        {value && href ? (
          <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            className="text-accent-ink underline"
          >
            {value}
          </a>
        ) : (
          <span className="text-faint">—</span>
        )}
      </dd>
    </div>
  )
}
