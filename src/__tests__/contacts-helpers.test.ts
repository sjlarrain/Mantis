import { resolveCompanyRef, mapBundleError } from '@/lib/contacts-helpers'

describe('resolveCompanyRef (no loose knots)', () => {
  it('prefers an existing company id', () => {
    expect(resolveCompanyRef('c-1', 'New Co')).toEqual({ id: 'c-1' })
  })
  it('falls back to a new company name', () => {
    expect(resolveCompanyRef('', 'Ring')).toEqual({ name: 'Ring' })
    expect(resolveCompanyRef(null, '  Snap  ')).toEqual({ name: 'Snap' })
  })
  it('returns null when neither is provided, blocking a company-less contact', () => {
    expect(resolveCompanyRef(null, null)).toBeNull()
    expect(resolveCompanyRef('', '   ')).toBeNull()
  })
})

describe('mapBundleError', () => {
  it('translates known errors', () => {
    expect(mapBundleError('COMPANY_NOT_FOUND')).toMatch(/no longer exists/)
    expect(mapBundleError('CONTACT_NAME_REQUIRED')).toMatch(/name is required/i)
    expect(mapBundleError('duplicate key value 23505')).toMatch(/already have a company/)
  })
  it('passes through unknown errors', () => {
    expect(mapBundleError('some db error')).toBe('some db error')
  })
})
