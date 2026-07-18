// Follow-up logic shared by the dashboard and the /follow-ups API.
//
// Two signals decide whether a contact "needs attention":
//   1. Manual  — an action carries an explicit follow_up_on date.
//   2. Quiet   — no activity for longer than the threshold for the contact's
//                class (Target/Reach/Backup). Thresholds are per user, stored
//                in user_profiles.settings, with these defaults.

export type ContactClass = 'target' | 'reach' | 'backup'

export const DEFAULT_QUIET_THRESHOLDS: Record<ContactClass, number> = {
  target: 14,
  reach: 30,
  backup: 60,
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Map a (possibly renamed) contact-class tag value to a ContactClass key.
 * Falls back to 'reach' so an unrecognized class still gets a sensible threshold.
 */
export function classKeyFromValue(value: string | null | undefined): ContactClass {
  const v = (value ?? '').trim().toLowerCase()
  if (v === 'target') return 'target'
  if (v === 'backup') return 'backup'
  return 'reach'
}

/** Whole days between two dates (b - a), truncated. */
export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY)
}

/**
 * A contact is "quiet" when the days since its last action meet or exceed the
 * threshold for its class. A contact with no actions is always quiet.
 */
export function isQuiet(
  lastActionOn: Date | null,
  contactClass: ContactClass,
  now: Date,
  thresholds: Record<ContactClass, number> = DEFAULT_QUIET_THRESHOLDS
): boolean {
  if (!lastActionOn) return true
  return daysBetween(lastActionOn, now) >= thresholds[contactClass]
}

export type FollowUpBucket = 'overdue' | 'today' | 'upcoming'

/** Bucket a manual follow-up date relative to today. */
export function followUpBucket(followUpOn: Date, now: Date): FollowUpBucket {
  const days = daysBetween(startOfDay(now), startOfDay(followUpOn))
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  return 'upcoming'
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
