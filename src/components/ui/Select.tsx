import { cn } from '@/lib/utils'
import type { SelectHTMLAttributes } from 'react'

const field =
  'h-10 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-sm ' +
  'text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'focus-visible:border-accent'

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(field, className)} {...props} />
}

// A labelled <select> over a tag list, with a blank "none" option.
export function TagSelect({
  name,
  label,
  tags,
  defaultValue,
  placeholder = '—',
}: {
  name: string
  label: string
  tags: { id: string; value: string }[]
  defaultValue?: string | null
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <Select id={name} name={name} defaultValue={defaultValue ?? ''}>
        <option value="">{placeholder}</option>
        {tags.map((t) => (
          <option key={t.id} value={t.id}>
            {t.value}
          </option>
        ))}
      </Select>
    </div>
  )
}
