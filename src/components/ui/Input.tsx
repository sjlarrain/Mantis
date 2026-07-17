import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

const field =
  'w-full rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-2 text-sm ' +
  'text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-accent focus-visible:border-accent'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, 'min-h-24 resize-y', className)} {...props} />
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-ink', className)}
      {...props}
    />
  )
}
