'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  filterComboboxItems,
  shouldOfferCreate,
  type ComboboxItem,
  type ComboboxSelection,
} from '@/lib/combobox'

const field =
  'h-10 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-sm ' +
  'text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-accent focus-visible:border-accent'

interface Props {
  items: ComboboxItem[]
  // Label of the current selection, shown when the field isn't being edited.
  selectedLabel?: string | null
  placeholder?: string
  allowCreate?: boolean
  createLabel?: (query: string) => string
  onSelect: (sel: ComboboxSelection) => void
  onClear?: () => void
  autoFocus?: boolean
  disabled?: boolean
  id?: string
}

// A single-select combobox that can also offer to create a new value from the
// typed text. Pure filtering/create-row logic lives in `@/lib/combobox`.
export function Combobox({
  items,
  selectedLabel,
  placeholder = 'Type to search…',
  allowCreate = false,
  createLabel = (q) => `Create “${q}”`,
  onSelect,
  onClear,
  autoFocus,
  disabled,
  id,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => filterComboboxItems(items, query), [items, query])
  const offerCreate = shouldOfferCreate(items, query, allowCreate)
  // Flat list of selectable rows: existing items first, then the optional create row.
  const rowCount = filtered.length + (offerCreate ? 1 : 0)

  // Close and revert to the selected label when clicking away.
  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function close() {
    setOpen(false)
    setEditing(false)
  }

  function beginEdit() {
    if (disabled) return
    setEditing(true)
    setQuery(selectedLabel ?? '')
    setOpen(true)
    setHighlight(0)
  }

  function pickExisting(it: ComboboxItem) {
    onSelect({ kind: 'existing', id: it.id, label: it.label })
    close()
  }

  function pickCreate() {
    onSelect({ kind: 'new', text: query.trim() })
    close()
  }

  function chooseRow(index: number) {
    if (index < filtered.length) pickExisting(filtered[index])
    else if (offerCreate) pickCreate()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, Math.max(rowCount - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && rowCount > 0) {
        e.preventDefault()
        chooseRow(highlight)
      }
    } else if (e.key === 'Escape') {
      close()
    }
  }

  const inputValue = editing ? query : selectedLabel ?? ''

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        type="text"
        className={cn(field, disabled && 'opacity-50')}
        placeholder={placeholder}
        value={inputValue}
        disabled={disabled}
        autoFocus={autoFocus}
        onFocus={beginEdit}
        onChange={(e) => {
          setEditing(true)
          setQuery(e.target.value)
          setOpen(true)
          setHighlight(0)
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {selectedLabel && !editing && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-2 my-auto h-5 text-xs text-faint hover:text-ink"
          aria-label="Clear selection"
        >
          ✕
        </button>
      )}

      {open && rowCount > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-[var(--radius)] border border-line-strong bg-surface py-1 shadow-sm"
        >
          {filtered.map((it, i) => (
            <li key={it.id} role="option" aria-selected={highlight === i}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickExisting(it)}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  'flex w-full flex-col items-start px-3 py-2 text-left text-sm',
                  highlight === i ? 'bg-accent-soft text-accent-ink' : 'text-ink'
                )}
              >
                <span>{it.label}</span>
                {it.sublabel && <span className="text-xs text-muted">{it.sublabel}</span>}
              </button>
            </li>
          ))}
          {offerCreate && (
            <li role="option" aria-selected={highlight === filtered.length}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={pickCreate}
                onMouseEnter={() => setHighlight(filtered.length)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium',
                  highlight === filtered.length ? 'bg-accent-soft' : '',
                  'text-accent-ink'
                )}
              >
                <span className="text-accent">＋</span>
                {createLabel(query.trim())}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
