import {
  daysBetween,
  isQuiet,
  followUpBucket,
  DEFAULT_QUIET_THRESHOLDS,
} from '@/lib/followups'

const NOW = new Date('2026-07-17T12:00:00Z')

describe('daysBetween', () => {
  it('counts whole days', () => {
    expect(daysBetween(new Date('2026-07-10T00:00:00Z'), NOW)).toBe(7)
  })
})

describe('isQuiet', () => {
  it('treats a contact with no actions as quiet', () => {
    expect(isQuiet(null, 'target', NOW)).toBe(true)
  })

  it('uses per-class thresholds (target=14, reach=30, backup=60)', () => {
    const d15 = new Date('2026-07-02T12:00:00Z') // 15 days ago
    expect(isQuiet(d15, 'target', NOW)).toBe(true) // >= 14
    expect(isQuiet(d15, 'reach', NOW)).toBe(false) // < 30
    expect(isQuiet(d15, 'backup', NOW)).toBe(false) // < 60
  })

  it('is not quiet at exactly one day of recent activity', () => {
    const yesterday = new Date('2026-07-16T12:00:00Z')
    expect(isQuiet(yesterday, 'target', NOW)).toBe(false)
  })

  it('honors custom thresholds', () => {
    const d5 = new Date('2026-07-12T12:00:00Z')
    expect(isQuiet(d5, 'target', NOW, { ...DEFAULT_QUIET_THRESHOLDS, target: 3 })).toBe(true)
  })
})

describe('followUpBucket', () => {
  it('buckets by date relative to today', () => {
    expect(followUpBucket(new Date('2026-07-15T00:00:00Z'), NOW)).toBe('overdue')
    expect(followUpBucket(new Date('2026-07-17T23:00:00Z'), NOW)).toBe('today')
    expect(followUpBucket(new Date('2026-07-20T00:00:00Z'), NOW)).toBe('upcoming')
  })
})
