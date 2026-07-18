'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sheet } from './ui/Sheet'
import { CREATE_ACTIONS } from './create-actions'

// Mobile-only floating "+" button. Tapping it opens a bottom sheet with the
// create actions — the mobile equivalent of the desktop New menu.
export function CreateFab() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Create"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl leading-none text-white shadow-lg transition-transform active:scale-95 md:hidden"
      >
        ＋
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Create">
        <div className="flex flex-col gap-1">
          {CREATE_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-[var(--radius)] px-3 py-3 hover:bg-accent-soft"
            >
              <span className="w-5 text-center text-accent">{a.glyph}</span>
              <span>
                <span className="block text-sm font-medium text-ink">{a.label}</span>
                <span className="block text-xs text-muted">{a.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </Sheet>
    </>
  )
}
