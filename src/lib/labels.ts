import type { TagCategory } from '@/types'

// Centralized UI strings. Kept in one place so a future translation only touches
// this file.

export const TAG_CATEGORY_LABEL: Record<TagCategory, string> = {
  contact_class: 'Contact class',
  recruiting_channel: 'Recruiting channel',
  action_type: 'Action type',
  position_title: 'Position title',
  wishlist_status: 'Wishlist status',
  label: 'Label',
}

// Order the categories appear in the Tag Manager.
export const TAG_CATEGORY_ORDER: TagCategory[] = [
  'contact_class',
  'recruiting_channel',
  'position_title',
  'action_type',
  'wishlist_status',
  'label',
]

export const TAG_CATEGORY_HINT: Record<TagCategory, string> = {
  contact_class: 'How you rank a contact or company: Target, Reach, Backup.',
  recruiting_channel: 'How a company recruits: OCR, BCR, Academic Intern.',
  position_title: 'Reusable job titles for contacts.',
  action_type: 'Kinds of touchpoint you log: Meeting, Cold outreach, …',
  wishlist_status: 'Pipeline stages for saved positions.',
  label: 'Free-form labels for companies and contacts.',
}
