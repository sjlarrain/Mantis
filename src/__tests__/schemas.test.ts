import {
  inboxCreateSchema,
  contactCreateSchema,
  companyRefSchema,
  tagCreateSchema,
} from '@/lib/schemas'

describe('inboxCreateSchema', () => {
  it('accepts text and defaults source to api', () => {
    const r = inboxCreateSchema.parse({ text: 'met Karla at Ring' })
    expect(r.source).toBe('api')
  })
  it('rejects empty text', () => {
    expect(inboxCreateSchema.safeParse({ text: '   ' }).success).toBe(false)
  })
  it('keeps a provided source and source_ref', () => {
    const r = inboxCreateSchema.parse({ text: 'x', source: 'whatsapp', source_ref: 'wamid.1' })
    expect(r).toMatchObject({ source: 'whatsapp', source_ref: 'wamid.1' })
  })
})

describe('companyRefSchema', () => {
  it('accepts an existing company id', () => {
    expect(companyRefSchema.safeParse({ id: '11111111-1111-4111-8111-111111111111' }).success).toBe(true)
  })
  it('accepts an inline new company by name', () => {
    expect(companyRefSchema.safeParse({ name: 'Ring' }).success).toBe(true)
  })
  it('rejects an empty company', () => {
    expect(companyRefSchema.safeParse({}).success).toBe(false)
  })
})

describe('contactCreateSchema (no loose knots)', () => {
  it('requires a company and a contact name', () => {
    expect(
      contactCreateSchema.safeParse({ company: { name: 'Ring' }, contact: { full_name: 'Karla' } })
        .success
    ).toBe(true)
    expect(contactCreateSchema.safeParse({ contact: { full_name: 'Karla' } }).success).toBe(false)
    expect(contactCreateSchema.safeParse({ company: { name: 'Ring' }, contact: {} }).success).toBe(false)
  })
})

describe('tagCreateSchema', () => {
  it('rejects unknown categories', () => {
    expect(tagCreateSchema.safeParse({ category: 'bogus', value: 'x' }).success).toBe(false)
    expect(tagCreateSchema.safeParse({ category: 'action_type', value: 'Meeting' }).success).toBe(true)
  })
})
