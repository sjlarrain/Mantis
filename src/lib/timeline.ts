import type { Action, Note } from '@/types'

// Merge a contact's actions and notes into one reverse-chronological timeline.
// Actions are dated by occurred_on; notes by created_at.

export type TimelineItem =
  | { kind: 'action'; at: string; action: Action }
  | { kind: 'note'; at: string; note: Note }

export function buildTimeline(actions: Action[], notes: Note[]): TimelineItem[] {
  const items: TimelineItem[] = [
    ...actions.map((a): TimelineItem => ({ kind: 'action', at: a.occurred_on, action: a })),
    // Notes tied to an action already show under that action's summary; only
    // standalone notes get their own timeline entry.
    ...notes
      .filter((n) => !n.action_id)
      .map((n): TimelineItem => ({ kind: 'note', at: n.created_at, note: n })),
  ]
  return items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
}
