import { completeFollowUp } from '@/lib/actions/actions'
import { CompleteFollowUpButton } from './CompleteFollowUpButton'
import { Badge } from '@/components/ui/Card'
import { formatDate } from '@/lib/format'
import type { TimelineItem } from '@/lib/timeline'

// The signature "thread" spine: a hairline connects the dots down the timeline.
export function Timeline({
  items,
  tagValue,
}: {
  items: TimelineItem[]
  tagValue: (id: string | null) => string | undefined
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No activity yet.</p>
  }

  return (
    <ol className="relative ml-2 border-l border-line">
      {items.map((item) => (
        <li key={key(item)} className="relative py-3 pl-6">
          <span className="absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full border-2 border-canvas bg-accent" />
          {item.kind === 'action' ? (
            <ActionRow item={item} tagValue={tagValue} />
          ) : (
            <div>
              <p className="text-xs text-faint">{formatDate(item.at)} · Note</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{item.note.body}</p>
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

function ActionRow({
  item,
  tagValue,
}: {
  item: Extract<TimelineItem, { kind: 'action' }>
  tagValue: (id: string | null) => string | undefined
}) {
  const a = item.action
  const type = tagValue(a.type_tag_id)
  const openFollowUp = a.follow_up_on && !a.follow_up_done_at
  const boundComplete = completeFollowUp.bind(null, a.id, a.contact_id)

  return (
    <div>
      <p className="text-xs text-faint">
        {formatDate(a.occurred_on)}
        {type ? ` · ${type}` : ''}
      </p>
      {a.summary && <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{a.summary}</p>}
      {a.follow_up_on && (
        <div className="mt-2 flex items-center gap-2">
          {openFollowUp ? (
            <>
              <Badge tone="attention">Follow up {formatDate(a.follow_up_on)}</Badge>
              <CompleteFollowUpButton action={boundComplete} />
            </>
          ) : (
            <Badge tone="neutral">Followed up</Badge>
          )}
        </div>
      )}
    </div>
  )
}

function key(item: TimelineItem): string {
  return item.kind === 'action' ? `a-${item.action.id}` : `n-${item.note.id}`
}
