'use client'

import { useState } from 'react'
import { Select } from '@/components/ui/Select'
import { Input, Label } from '@/components/ui/Input'
import type { Company } from '@/types'

// Pick an existing company or create one inline. Emits either a `company_id`
// (existing) or a `new_company_name` (new) form field, never both — so the
// server never gets a person pointing at a company that doesn't exist.
export function CompanyPicker({
  companies,
  defaultCompanyId,
}: {
  companies: Pick<Company, 'id' | 'name'>[]
  defaultCompanyId?: string | null
}) {
  const [mode, setMode] = useState<'existing' | 'new'>(
    companies.length === 0 ? 'new' : 'existing'
  )

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <Label className="mb-0">Company</Label>
        <button
          type="button"
          className="text-xs text-accent-ink underline underline-offset-2"
          onClick={() => setMode((m) => (m === 'existing' ? 'new' : 'existing'))}
        >
          {mode === 'existing' ? '+ New company' : 'Pick existing'}
        </button>
      </div>

      {mode === 'existing' ? (
        <Select name="company_id" defaultValue={defaultCompanyId ?? ''} required>
          <option value="" disabled>
            Select a company…
          </option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      ) : (
        <Input name="new_company_name" placeholder="New company name" required autoFocus />
      )}
    </div>
  )
}
