'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { TagSelect } from '@/components/ui/Select'
import { CompanyPicker } from './CompanyPicker'
import type { Company, Contact, Tag } from '@/types'

interface Props {
  contact?: Contact
  companies: Pick<Company, 'id' | 'name'>[]
  classTags: Tag[]
  titleTags: Tag[]
  // On create the picker is shown; on edit the company is fixed (change via move later).
  showCompanyPicker: boolean
  defaultCompanyId?: string | null
  action: (form: FormData) => Promise<{ ok: false; error: string } | void>
}

export function ContactForm({
  contact,
  companies,
  classTags,
  titleTags,
  showCompanyPicker,
  defaultCompanyId,
  action,
}: Props) {
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
      {showCompanyPicker && (
        <CompanyPicker companies={companies} defaultCompanyId={defaultCompanyId} />
      )}

      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required defaultValue={contact?.full_name} autoFocus={!showCompanyPicker} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TagSelect name="class_tag_id" label="Class" tags={classTags} defaultValue={contact?.class_tag_id} />
        <TagSelect name="title_tag_id" label="Title (catalog)" tags={titleTags} defaultValue={contact?.title_tag_id} />
      </div>

      <div>
        <Label htmlFor="title_free">Title (free text)</Label>
        <Input id="title_free" name="title_free" placeholder="e.g. Head of Community Engagement"
          defaultValue={contact?.title_free ?? ''} />
      </div>

      <div>
        <Label htmlFor="how_i_know">How I know them</Label>
        <Input id="how_i_know" name="how_i_know" placeholder="LinkedIn, Anderson alum, intro from…"
          defaultValue={contact?.how_i_know ?? ''} />
      </div>

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-1">Channels</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ''} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={contact?.phone ?? ''} />
          </div>
        </div>
        <div>
          <Label htmlFor="linkedin_url">LinkedIn URL</Label>
          <Input id="linkedin_url" name="linkedin_url" placeholder="https://linkedin.com/in/…"
            defaultValue={contact?.linkedin_url ?? ''} />
        </div>
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : contact ? 'Save changes' : 'Create person'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
