'use client'

import { useState, useTransition } from 'react'
import { createTag, renameTag, setTagArchived } from '@/lib/actions/tags'
import { TAG_CATEGORY_LABEL, TAG_CATEGORY_ORDER, TAG_CATEGORY_HINT } from '@/lib/labels'
import type { Tag, TagCategory } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Badge } from '@/components/ui/Card'

// Groups tags by category and lets the user add, rename, and archive values.
export function TagManager({ initialTags }: { initialTags: Tag[] }) {
  const byCategory = (cat: TagCategory) =>
    initialTags.filter((t) => t.category === cat).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      {TAG_CATEGORY_ORDER.map((cat) => (
        <Card key={cat} className="p-4">
          <div className="mb-1 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">{TAG_CATEGORY_LABEL[cat]}</h3>
          </div>
          <p className="mb-3 text-xs text-muted">{TAG_CATEGORY_HINT[cat]}</p>
          <ul className="mb-3 divide-y divide-line">
            {byCategory(cat).map((tag) => (
              <TagRow key={tag.id} tag={tag} />
            ))}
            {byCategory(cat).length === 0 && (
              <li className="py-2 text-sm text-faint">No values yet.</li>
            )}
          </ul>
          <AddTag category={cat} />
        </Card>
      ))}
    </div>
  )
}

function TagRow({ tag }: { tag: Tag }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(tag.value)
  const [pending, start] = useTransition()
  const archived = tag.archived_at !== null

  return (
    <li className="flex items-center gap-2 py-2">
      {editing ? (
        <>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 max-w-48"
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => start(async () => { await renameTag(tag.id, value); setEditing(false) })}
            disabled={pending}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setValue(tag.value); setEditing(false) }}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <span className={archived ? 'text-sm text-faint line-through' : 'text-sm'}>
            {tag.value}
          </span>
          {archived && <Badge tone="neutral">archived</Badge>}
          <div className="ml-auto flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Rename
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => start(() => setTagArchived(tag.id, !archived).then(() => {}))}
              disabled={pending}
            >
              {archived ? 'Restore' : 'Archive'}
            </Button>
          </div>
        </>
      )}
    </li>
  )
}

function AddTag({ category }: { category: TagCategory }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function add() {
    if (!value.trim()) return
    start(async () => {
      const res = await createTag({ category, value: value.trim() })
      if (res.ok) {
        setValue('')
        setError(null)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
        placeholder="Add value…"
        className="h-8 max-w-48"
      />
      <Button size="sm" variant="secondary" onClick={add} disabled={pending || !value.trim()}>
        Add
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
