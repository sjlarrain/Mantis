'use client'

import { useState } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { Label } from '@/components/ui/Input'
import type { ComboboxSelection } from '@/lib/combobox'
import type { Company } from '@/types'

type Selection =
  | { kind: 'existing'; id: string; label: string }
  | { kind: 'new'; text: string }
  | null

// Pick an existing company or create one by typing its name. Emits either a
// `company_id` (existing) or a `new_company_name` (new) — never both — so the
// server never gets a person pointing at a company that doesn't exist.
export function CompanyPicker({
  companies,
  defaultCompanyId,
}: {
  companies: Pick<Company, 'id' | 'name'>[]
  defaultCompanyId?: string | null
}) {
  const items = companies.map((c) => ({ id: c.id, label: c.name }))
  const initial: Selection = defaultCompanyId
    ? {
        kind: 'existing',
        id: defaultCompanyId,
        label: companies.find((c) => c.id === defaultCompanyId)?.name ?? '',
      }
    : null
  const [selection, setSelection] = useState<Selection>(initial)

  const selectedLabel =
    selection === null ? null : selection.kind === 'existing' ? selection.label : selection.text

  function onSelect(sel: ComboboxSelection) {
    if (sel.kind === 'existing') setSelection({ kind: 'existing', id: sel.id, label: sel.label })
    else setSelection({ kind: 'new', text: sel.text })
  }

  return (
    <div>
      <Label htmlFor="company-combobox">Company</Label>
      {selection?.kind === 'existing' && (
        <input type="hidden" name="company_id" value={selection.id} />
      )}
      {selection?.kind === 'new' && (
        <input type="hidden" name="new_company_name" value={selection.text} />
      )}
      <Combobox
        id="company-combobox"
        items={items}
        selectedLabel={selectedLabel}
        placeholder="Search or create a company…"
        allowCreate
        createLabel={(q) => `Create company “${q}”`}
        onSelect={onSelect}
        onClear={() => setSelection(null)}
      />
      {selection?.kind === 'new' && (
        <p className="mt-1 text-xs text-muted">New company “{selection.text}” will be created.</p>
      )}
    </div>
  )
}
