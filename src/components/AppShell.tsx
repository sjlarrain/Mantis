'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { CREATE_ACTIONS } from './create-actions'
import { CreateFab } from './CreateFab'

// Navigation destinations. Kept in one place so the desktop top bar and the
// mobile tab bar stay in sync.
const NAV = [
  { href: '/', label: 'Dashboard', glyph: '◆' },
  { href: '/people', label: 'People', glyph: '❋' },
  { href: '/companies', label: 'Companies', glyph: '▢' },
  { href: '/table', label: 'Table', glyph: '▦' },
  { href: '/notes', label: 'Notes', glyph: '✎' },
  { href: '/wishlist', label: 'Wishlist', glyph: '☆' },
  { href: '/guide', label: 'Guide', glyph: '❔' }, // TEMPORARY — remove after review
]

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col">
      {/* Desktop top bar */}
      <header className="sticky top-0 z-20 hidden border-b border-line bg-surface/95 backdrop-blur md:block">
        <div className="flex h-14 items-center gap-6 px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-ink">Mantis</span>
            <span className="eyebrow">CRM</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-[var(--radius)] px-3 py-1.5 text-sm transition-colors',
                  isActive(pathname, item.href)
                    ? 'bg-accent-soft font-medium text-accent-ink'
                    : 'text-muted hover:bg-accent-soft hover:text-ink'
                )}
              >
                <span className="text-accent">{item.glyph}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NewMenu />
            <Link
              href="/settings"
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-base transition-colors',
                isActive(pathname, '/settings')
                  ? 'bg-accent-soft text-accent-ink'
                  : 'text-muted hover:bg-accent-soft hover:text-ink'
              )}
              aria-label="Settings"
            >
              ⚙
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile brand bar */}
      <header className="sticky top-0 z-20 flex h-12 items-center border-b border-line bg-surface/95 px-4 backdrop-blur md:hidden">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-ink">Mantis</span>
          <span className="eyebrow">CRM</span>
        </Link>
      </header>

      {/* Main column */}
      <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>

      {/* Mobile create button + sheet */}
      <CreateFab />

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-surface/95 backdrop-blur md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px]',
              isActive(pathname, item.href) ? 'text-accent-ink' : 'text-muted'
            )}
          >
            <span className="text-base leading-none">{item.glyph}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

// Desktop "New" dropdown: the create actions, opened from the top bar.
function NewMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-accent px-3 text-sm font-medium text-white transition-colors hover:opacity-90"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="leading-none">＋</span> New
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-[var(--radius)] border border-line-strong bg-surface py-1 shadow-sm"
        >
          {CREATE_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-accent-soft"
            >
              <span className="w-5 text-center text-accent">{a.glyph}</span>
              <span>
                <span className="block text-sm font-medium text-ink">{a.label}</span>
                <span className="block text-xs text-muted">{a.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
