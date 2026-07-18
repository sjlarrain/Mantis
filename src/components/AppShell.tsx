'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// Navigation destinations. Kept in one place so the desktop rail and the mobile
// tab bar stay in sync.
const NAV = [
  { href: '/', label: 'Dashboard', glyph: '◆' },
  { href: '/people', label: 'People', glyph: '❋' },
  { href: '/companies', label: 'Companies', glyph: '▢' },
  { href: '/table', label: 'Table', glyph: '▦' },
  { href: '/notes', label: 'Notes', glyph: '✎' },
  { href: '/wishlist', label: 'Wishlist', glyph: '☆' },
]

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-baseline gap-2 px-2">
          <span className="text-lg font-semibold tracking-tight text-ink">Mantis</span>
          <span className="eyebrow">CRM</span>
        </Link>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm transition-colors',
                isActive(pathname, item.href)
                  ? 'bg-accent-soft font-medium text-accent-ink'
                  : 'text-muted hover:bg-accent-soft hover:text-ink'
              )}
            >
              <span className="w-4 text-center text-accent">{item.glyph}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm text-muted hover:text-ink"
          >
            <span className="w-4 text-center">⚙</span> Settings
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

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
