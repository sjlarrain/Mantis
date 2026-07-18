'use client'

import { useState, useTransition } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { Label } from '@/components/ui/Input'
import { createTag } from '@/lib/actions/tags'
import type { ComboboxSelection } from '@/lib/combobox'
import type { Tag } from '@/types'

// Title picker that can create a new title tag inline — no trip to Settings.
// Emits the chosen tag id via a hidden `title_tag_id` field for the form post.
export function TitleField({
  titleTags,
  defaultValue,
}: {
  titleTags: Tag[]
  defaultValue?: string | null
}) {
  const [tags, setTags] = useState(titleTags)
  const [selectedId, setSelectedId] = useState<string | null>(defaultValue ?? null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const items = tags.map((t) => ({ id: t.id, label: t.value }))
  const selectedLabel = tags.find((t) => t.id === selectedId)?.value ?? null

  function onSelect(sel: ComboboxSelection) {
    if (sel.kind === 'existing') {
      setSelectedId(sel.id)
      setError(null)
      return
    }
    start(async () => {
      const res = await createTag({ category: 'position_title', value: sel.text })
      if (res.ok) {
        setTags((prev) => (prev.some((t) => t.id === res.tag.id) ? prev : [...prev, res.tag]))
        setSelectedId(res.tag.id)
        setError(null)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div>
      <Label htmlFor="title-combobox">Title</Label>
      <input type="hidden" name="title_tag_id" value={selectedId ?? ''} />
      <Combobox
        id="title-combobox"
        items={items}
        selectedLabel={selectedLabel}
        placeholder={pending ? 'Adding title…' : 'Search or create a title…'}
        allowCreate
        createLabel={(q) => `Create title “${q}”`}
        onSelect={onSelect}
        onClear={() => setSelectedId(null)}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
