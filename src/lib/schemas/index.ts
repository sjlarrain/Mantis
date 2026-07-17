import { z } from 'zod'

// Shared Zod schemas — the single source of truth for validation, used by both
// the web forms and the /api/v1 routes.

const uuid = z.string().uuid()
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')

export const noteSourceEnum = z.enum(['app', 'api', 'whatsapp', 'claude'])

// ── Companies ──────────────────────────────────────────────────────────────
export const companyCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  website: z.string().trim().max(500).optional(),
  industry: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  description: z.string().max(5000).optional(),
  recruiting_channel_tag_id: uuid.optional(),
  priority_tag_id: uuid.optional(),
  notes: z.string().max(5000).optional(),
})
export const companyUpdateSchema = companyCreateSchema.partial()

// Either link an existing company by id, or create one inline (no loose knots).
export const companyRefSchema = z.union([
  z.object({ id: uuid }),
  companyCreateSchema,
])

// ── Contacts ───────────────────────────────────────────────────────────────
export const contactCoreSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  title_tag_id: uuid.optional(),
  title_free: z.string().trim().max(200).optional(),
  class_tag_id: uuid.optional(),
  how_i_know: z.string().max(500).optional(),
  email: z.string().trim().email().max(320).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional(),
  linkedin_url: z.string().trim().max(500).optional(),
})

// POST /contacts: contact + its company (existing or new) + optional first touch.
export const contactCreateSchema = z.object({
  company: companyRefSchema,
  contact: contactCoreSchema,
  action: z
    .object({
      type_tag_id: uuid.optional(),
      occurred_on: isoDate.optional(),
      summary: z.string().max(5000).optional(),
      follow_up_on: isoDate.optional(),
      source: noteSourceEnum.optional(),
    })
    .optional(),
  note: z.object({ body: z.string().min(1).max(5000) }).optional(),
})
export const contactUpdateSchema = contactCoreSchema.partial()

// ── Actions ────────────────────────────────────────────────────────────────
export const actionCreateSchema = z.object({
  contact_id: uuid,
  type_tag_id: uuid.optional(),
  occurred_on: isoDate.optional(),
  summary: z.string().max(5000).optional(),
  follow_up_on: isoDate.optional(),
  source: noteSourceEnum.optional(),
})

// ── Notes / inbox ──────────────────────────────────────────────────────────
export const noteCreateSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  contact_id: uuid.optional(),
  action_id: uuid.optional(),
  source: noteSourceEnum.optional(),
})

// POST /inbox — quick capture (e.g. from WhatsApp via Secretariat).
export const inboxCreateSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  source: noteSourceEnum.default('api'),
  source_ref: z.string().trim().max(200).optional(),
})

// ── Tags ───────────────────────────────────────────────────────────────────
export const tagCategoryEnum = z.enum([
  'contact_class',
  'recruiting_channel',
  'action_type',
  'position_title',
  'wishlist_status',
  'label',
])
export const tagCreateSchema = z.object({
  category: tagCategoryEnum,
  value: z.string().trim().min(1).max(100),
  color: z.string().trim().max(20).optional(),
  sort_order: z.number().int().optional(),
})

// ── Wishlist ───────────────────────────────────────────────────────────────
export const wishlistCreateSchema = z.object({
  company_id: uuid.optional(),
  title: z.string().trim().min(1).max(300),
  url: z.string().trim().max(500).optional(),
  status_tag_id: uuid.optional(),
  notes: z.string().max(5000).optional(),
  follow_up_on: isoDate.optional(),
})

export type CompanyCreate = z.infer<typeof companyCreateSchema>
export type ContactCreate = z.infer<typeof contactCreateSchema>
export type ActionCreate = z.infer<typeof actionCreateSchema>
export type InboxCreate = z.infer<typeof inboxCreateSchema>
export type TagCreate = z.infer<typeof tagCreateSchema>
export type WishlistCreate = z.infer<typeof wishlistCreateSchema>
