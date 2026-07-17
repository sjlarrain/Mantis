// Database row shapes (mirrors supabase/migrations). Kept hand-written and small
// rather than generated, since the schema is stable and owned here.

export type TagCategory =
  | 'contact_class'
  | 'recruiting_channel'
  | 'action_type'
  | 'position_title'
  | 'wishlist_status'
  | 'label'

export interface Tag {
  id: string
  category: TagCategory
  value: string
  color: string | null
  sort_order: number
  archived_at: string | null
}

export interface Company {
  id: string
  name: string
  website: string | null
  industry: string | null
  location: string | null
  description: string | null
  recruiting_channel_tag_id: string | null
  priority_tag_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Contact {
  id: string
  company_id: string
  full_name: string
  title_tag_id: string | null
  title_free: string | null
  class_tag_id: string | null
  how_i_know: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  next_follow_up_date: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Action {
  id: string
  contact_id: string
  type_tag_id: string | null
  occurred_on: string
  summary: string | null
  follow_up_on: string | null
  follow_up_done_at: string | null
  source: 'app' | 'api' | 'whatsapp' | 'claude'
  created_at: string
}

export interface Note {
  id: string
  body: string
  contact_id: string | null
  action_id: string | null
  source: 'app' | 'api' | 'whatsapp' | 'claude'
  source_ref: string | null
  status: 'inbox' | 'linked'
  created_at: string
}
