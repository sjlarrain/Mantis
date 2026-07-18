import { filterComboboxItems, shouldOfferCreate, type ComboboxItem } from '@/lib/combobox'

const items: ComboboxItem[] = [
  { id: '1', label: 'Ana Ruiz', sublabel: 'Acme' },
  { id: '2', label: 'Bruno Diaz', sublabel: 'Globex' },
  { id: '3', label: 'Carla Neto', sublabel: 'Acme' },
]

describe('filterComboboxItems', () => {
  it('returns everything for an empty query', () => {
    expect(filterComboboxItems(items, '   ')).toHaveLength(3)
  })
  it('matches on label, case-insensitively', () => {
    expect(filterComboboxItems(items, 'bru').map((i) => i.id)).toEqual(['2'])
  })
  it('matches on sublabel too', () => {
    expect(filterComboboxItems(items, 'acme').map((i) => i.id)).toEqual(['1', '3'])
  })
  it('returns nothing when there is no match', () => {
    expect(filterComboboxItems(items, 'zzz')).toEqual([])
  })
})

describe('shouldOfferCreate', () => {
  it('is off when creating is not allowed', () => {
    expect(shouldOfferCreate(items, 'New Person', false)).toBe(false)
  })
  it('is off for an empty query', () => {
    expect(shouldOfferCreate(items, '  ', true)).toBe(false)
  })
  it('offers create for an unknown value', () => {
    expect(shouldOfferCreate(items, 'New Person', true)).toBe(true)
  })
  it('does not offer create when a label already matches exactly (case-insensitive)', () => {
    expect(shouldOfferCreate(items, 'ana ruiz', true)).toBe(false)
  })
  it('still offers create for a partial match that is not exact', () => {
    expect(shouldOfferCreate(items, 'Ana', true)).toBe(true)
  })
})
