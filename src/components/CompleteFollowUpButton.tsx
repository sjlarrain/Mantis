'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// Marks an action's follow-up done. The action is bound server-side with the
// action + contact ids.
export function CompleteFollowUpButton({ action }: { action: () => Promise<{ ok: true }> }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => start(async () => { await action(); router.refresh() })}
    >
      {pending ? 'Marking…' : 'Mark done'}
    </Button>
  )
}
