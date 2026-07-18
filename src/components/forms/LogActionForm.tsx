'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAction } from '@/lib/actions/actions'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Label } from '@/components/ui/Input'
import { TagSelect } from '@/components/ui/Select'
import type { Tag } from '@/types'

const today = () => new Date().toISOString().slice(0, 10)

// Inline "log a touchpoint" form shown on a person's profile.
export function LogActionForm({ contactId, typeTags }: { contactId: string; typeTags: Tag[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    start(async () => {
      const res = await createAction(form)
      if (res.ok) {
        formRef.current?.reset()
        setError(null)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3 rounded-[var(--radius)] border border-line bg-surface p-4">
      <input type="hidden" name="contact_id" value={contactId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <TagSelect name="type_tag_id" label="Type" tags={typeTags} />
        <div>
          <Label htmlFor="occurred_on">Date</Label>
          <Input id="occurred_on" name="occurred_on" type="date" defaultValue={today()} />
        </div>
      </div>
      <div>
        <Label htmlFor="summary">What happened</Label>
        <Textarea id="summary" name="summary" className="min-h-16" placeholder="Short summary of the touchpoint…" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="follow_up_on">Follow up on</Label>
          <Input id="follow_up_on" name="follow_up_on" type="date" />
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? 'Logging…' : 'Log action'}
      </Button>
    </form>
  )
}
