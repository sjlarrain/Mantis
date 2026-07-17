'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Label } from '@/components/ui/Input'
import { TagSelect } from '@/components/ui/Select'
import type { Company, Tag } from '@/types'

interface Props {
  company?: Company
  channelTags: Tag[]
  classTags: Tag[]
  action: (form: FormData) => Promise<{ ok: false; error: string } | void>
}

// Shared create/edit form. The server action redirects on success, so a resolved
// promise without an error means we're navigating away.
export function CompanyForm({ company, channelTags, classTags, action }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    start(async () => {
      const res = await action(form)
      if (res && !res.ok) setError(res.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div>
        <Label htmlFor="name">Company name</Label>
        <Input id="name" name="name" required defaultValue={company?.name} autoFocus />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TagSelect name="recruiting_channel_tag_id" label="Recruiting channel"
          tags={channelTags} defaultValue={company?.recruiting_channel_tag_id} />
        <TagSelect name="priority_tag_id" label="Priority"
          tags={classTags} defaultValue={company?.priority_tag_id} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" name="industry" defaultValue={company?.industry ?? ''} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={company?.location ?? ''} />
        </div>
      </div>

      <div>
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" placeholder="https://…" defaultValue={company?.website ?? ''} />
      </div>

      <div>
        <Label htmlFor="description">What they do</Label>
        <Textarea id="description" name="description" defaultValue={company?.description ?? ''} />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={company?.notes ?? ''} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : company ? 'Save changes' : 'Create company'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
