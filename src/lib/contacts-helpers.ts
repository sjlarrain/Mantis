// Pure helpers for the contact flow, kept out of the 'use server' module so they
// can be unit-tested directly.

export type CompanyRef = { id: string } | { name: string }

/**
 * Resolve which company a new contact attaches to. Returns an existing id when
 * given one, otherwise a new-company name, otherwise null (nothing chosen).
 * This is the guard that stops a person being created with no company.
 */
export function resolveCompanyRef(
  companyId: string | null | undefined,
  newCompanyName: string | null | undefined
): CompanyRef | null {
  if (companyId && companyId.trim() !== '') return { id: companyId.trim() }
  if (newCompanyName && newCompanyName.trim() !== '') return { name: newCompanyName.trim() }
  return null
}

/** Map a raw Postgres/bundle error message to a friendly, user-facing string. */
export function mapBundleError(message: string): string {
  if (message.includes('COMPANY_NOT_FOUND')) return 'That company no longer exists.'
  if (message.includes('COMPANY_NAME_REQUIRED')) return 'Company name is required.'
  if (message.includes('CONTACT_NAME_REQUIRED')) return 'Contact name is required.'
  if (message.includes('23505')) return 'You already have a company with that name.'
  return message
}
