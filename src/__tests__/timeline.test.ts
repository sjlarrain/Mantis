import { buildTimeline } from '@/lib/timeline'
import type { Action, Note } from '@/types'

const action = (id: string, occurred_on: string): Action => ({
  id,
  contact_id: 'c1',
  type_tag_id: null,
  occurred_on,
  summary: null,
  follow_up_on: null,
  follow_up_done_at: null,
  source: 'app',
  created_at: occurred_on + 'T00:00:00Z',
})

const note = (id: string, created_at: string, action_id: string | null = null): Note => ({
  id,
  body: 'n',
  contact_id: 'c1',
  action_id,
  source: 'app',
  source_ref: null,
  status: 'linked',
  created_at,
})

describe('buildTimeline', () => {
  it('merges actions and standalone notes newest-first', () => {
    const items = buildTimeline(
      [action('a1', '2026-07-01'), action('a2', '2026-07-10')],
      [note('n1', '2026-07-05T00:00:00Z')]
    )
    expect(items.map((i) => (i.kind === 'action' ? i.action.id : i.note.id))).toEqual([
      'a2',
      'n1',
      'a1',
    ])
  })

  it('omits notes already attached to an action', () => {
    const items = buildTimeline([action('a1', '2026-07-01')], [note('n1', '2026-07-02T00:00:00Z', 'a1')])
    expect(items).toHaveLength(1)
    expect(items[0].kind).toBe('action')
  })
})
