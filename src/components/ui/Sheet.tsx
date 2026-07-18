'use client'

import { useEffect } from 'react'

// A lightweight bottom sheet: a dimmed backdrop plus a panel that rises from the
// bottom edge. Used by the mobile create menu. Closes on backdrop tap or Escape.
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
      />
      <div className="relative z-10 rounded-t-2xl border-t border-line bg-surface px-4 pb-8 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        {title && <p className="eyebrow mb-2 px-1">{title}</p>}
        {children}
      </div>
    </div>
  )
}
