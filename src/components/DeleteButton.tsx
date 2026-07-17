'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/Button'

// Confirms, then invokes a bound server action that soft-deletes and redirects.
export function DeleteButton({
  action,
  confirm,
  label = 'Delete',
}: {
  action: () => Promise<void>
  confirm: string
  label?: string
}) {
  const [pending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirm)) start(() => action())
      }}
    >
      {pending ? 'Deleting…' : label}
    </Button>
  )
}
