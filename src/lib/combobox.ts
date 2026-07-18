// Pure logic for the creatable combobox, kept out of the component so it can be
// unit-tested directly (the app has no jsdom test env).

export interface ComboboxItem {
  id: string
  label: string
  sublabel?: string
}

// A combobox emits one of two selections: an existing item, or a request to
// create something new from the typed text. Each consumer decides what "new"
// means (create a tag, stash a new-company name, open a person sub-form…).
export type ComboboxSelection =
  | { kind: 'existing'; id: string; label: string }
  | { kind: 'new'; text: string }

// Case-insensitive substring match over label + sublabel. An empty query keeps
// the full list so the dropdown works as a plain picker too.
export function filterComboboxItems<T extends ComboboxItem>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (it) => it.label.toLowerCase().includes(q) || (it.sublabel?.toLowerCase().includes(q) ?? false)
  )
}

// Offer a "Create '<query>'" row only when creating is allowed, the query is
// non-empty, and no existing item's label already matches it exactly — so we
// never nudge the user to duplicate a value that already exists.
export function shouldOfferCreate(
  items: ComboboxItem[],
  query: string,
  allowCreate: boolean
): boolean {
  const q = query.trim()
  if (!allowCreate || q === '') return false
  return !items.some((it) => it.label.trim().toLowerCase() === q.toLowerCase())
}
