'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAction } from '@/lib/actions/actions'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Label } from '@/components/ui/Input'
import { TagSelect } from '@/components/ui/Select'
import { Combobox } from '@/components/ui/Combobox'
import { ContactForm } from './ContactForm'
import type { ComboboxSelection } from '@/lib/combobox'
import type { Company, Tag } from '@/types'

type ContactLite = { id: string; full_name: string; company: Pick<Company, 'id' | 'name'> | null }

const today = () => new Date().toISOString().slice(0, 10)

// Log a meeting (touchpoint). If the person doesn't exist yet, typing their name
// offers "Create" — which opens the person form inline and, on save, returns
// here with that person selected and the meeting fields intact.
export function NewMeetingFlow({
  contacts: initialContacts,
  companies,
  actionTypeTags,
  classTags,
  titleTags,
}: {
  contacts: ContactLite[]
  companies: Pick<Company, 'id' | 'name'>[]
  actionTypeTags: Tag[]
  classTags: Tag[]
  titleTags: Tag[]
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [contacts, setContacts] = useState(initialContacts)
  const [selected, setSelected] = useState<ContactLite | null>(null)
  const [step, setStep] = useState<'compose' | 'create-person'>('compose')
  const [pendingName, setPendingName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const items = contacts.map((c) => ({
    id: c.id,
    label: c.full_name,
    sublabel: c.company?.name,
  }))

  function onContactSelect(sel: ComboboxSelection) {
    if (sel.kind === 'existing') {
      const c = contacts.find((x) => x.id === sel.id)
      setSelected(c ?? { id: sel.id, full_name: sel.label, company: null })
      setError(null)
    } else {
      setPendingName(sel.text)
      setStep('create-person')
    }
  }

  function onPersonCreated(contact: ContactLite) {
    setContacts((prev) => [contact, ...prev.filter((c) => c.id !== contact.id)])
    setSelected(contact)
    setStep('compose')
  }

  function submitMeeting(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) {
      setError('Pick or create a contact first.')
      return
    }
    const form = new FormData(e.currentTarget)
    start(async () => {
      const res = await createAction(form)
      if (res.ok) router.push(`/people/${selected.id}`)
      else setError(res.error)
    })
  }

  return (
    <div className="max-w-xl">
      {/* Compose stays mounted (just hidden) so the meeting fields survive the
          detour through the person form. */}
      <form
        ref={formRef}
        onSubmit={submitMeeting}
        className={step === 'create-person' ? 'hidden' : 'space-y-5'}
      >
        <input type="hidden" name="contact_id" value={selected?.id ?? ''} />

        <div>
          <Label htmlFor="contact-combobox">Who did you meet?</Label>
          <Combobox
            id="contact-combobox"
            items={items}
            selectedLabel={selected?.full_name ?? null}
            placeholder="Search a contact, or type a new name…"
            allowCreate
            createLabel={(q) => `Create contact “${q}”`}
            onSelect={onContactSelect}
            onClear={() => setSelected(null)}
          />
          {selected?.company && (
            <p className="mt-1 text-xs text-muted">at {selected.company.name}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TagSelect name="type_tag_id" label="Type" tags={actionTypeTags} />
          <div>
            <Label htmlFor="occurred_on">Date</Label>
            <Input id="occurred_on" name="occurred_on" type="date" defaultValue={today()} />
          </div>
        </div>

        <div>
          <Label htmlFor="summary">What happened</Label>
          <Textarea id="summary" name="summary" className="min-h-20" placeholder="Short summary of the meeting…" />
        </div>

        <div>
          <Label htmlFor="follow_up_on">Follow up on</Label>
          <Input id="follow_up_on" name="follow_up_on" type="date" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending || !selected}>
            {pending ? 'Logging…' : 'Log meeting'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      {step === 'create-person' && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow">New contact</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Create this person, then back to the meeting
            </h2>
          </div>
          <ContactForm
            companies={companies}
            classTags={classTags}
            titleTags={titleTags}
            showCompanyPicker
            initialName={pendingName}
            submitLabel="Create & use"
            onCreated={onPersonCreated}
            onCancel={() => setStep('compose')}
          />
        </div>
      )}
    </div>
  )
}
