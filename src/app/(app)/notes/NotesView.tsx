'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createNote, classifyNote, deleteNote } from '@/lib/actions/notes'
import type { NoteWithContact } from '@/lib/actions/notes'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, Badge, EmptyState } from '@/components/ui/Card'
import { formatDate } from '@/lib/format'

type Tab = 'inbox' | 'all'
type ContactOption = { id: string; full_name: string }

export function NotesView({
  inbox,
  all,
  contacts,
}: {
  inbox: NoteWithContact[]
  all: NoteWithContact[]
  contacts: ContactOption[]
}) {
  const [tab, setTab] = useState<Tab>(inbox.length > 0 ? 'inbox' : 'all')

  return (
    <div className="space-y-6">
      <JotCapture />

      <div className="flex gap-1 border-b border-line">
        <TabButton active={tab === 'inbox'} onClick={() => setTab('inbox')}>
          Inbox {inbox.length > 0 && <Badge tone="attention">{inbox.length}</Badge>}
        </TabButton>
        <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
          All notes
        </TabButton>
      </div>

      {tab === 'inbox' ? (
        inbox.length === 0 ? (
          <EmptyState title="Inbox is clear" hint="Quick notes captured here — including from WhatsApp — wait to be linked to a person." />
        ) : (
          <ul className="space-y-3">
            {inbox.map((n) => (
              <InboxRow key={n.id} note={n} contacts={contacts} />
            ))}
          </ul>
        )
      ) : all.length === 0 ? (
        <EmptyState title="No notes yet" hint="Capture a quick thought above, or add notes from a person's profile." />
      ) : (
        <ul className="space-y-3">
          {all.map((n) => (
            <AllRow key={n.id} note={n} />
          ))}
        </ul>
      )}
    </div>
  )
}

function JotCapture() {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [pending, start] = useTransition()

  function save() {
    if (!body.trim()) return
    start(async () => {
      await createNote({ body })
      setBody('')
      router.refresh()
    })
  }

  return (
    <Card className="p-4">
      <p className="eyebrow mb-2">Quick capture</p>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Jot an idea or a note to classify later…"
        className="min-h-16"
      />
      <div className="mt-2">
        <Button size="sm" onClick={save} disabled={pending || !body.trim()}>
          {pending ? 'Saving…' : 'Save to inbox'}
        </Button>
      </div>
    </Card>
  )
}

function InboxRow({ note, contacts }: { note: NoteWithContact; contacts: ContactOption[] }) {
  const router = useRouter()
  const [contactId, setContactId] = useState('')
  const [pending, start] = useTransition()

  return (
    <Card className="p-4">
      <p className="text-xs text-faint">
        {formatDate(note.created_at)} · {note.source}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{note.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          className="h-8 max-w-56"
        >
          <option value="">Link to person…</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          disabled={!contactId || pending}
          onClick={() => start(async () => { await classifyNote(note.id, contactId); router.refresh() })}
        >
          Link
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => start(async () => { await deleteNote(note.id); router.refresh() })}
        >
          Discard
        </Button>
      </div>
    </Card>
  )
}

function AllRow({ note }: { note: NoteWithContact }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-faint">
        {formatDate(note.created_at)}
        {note.status === 'inbox' && ' · unlinked'}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{note.body}</p>
      {note.contact && (
        <p className="mt-2 text-sm">
          <Link href={`/people/${note.contact.id}`} className="text-accent-ink underline">
            {note.contact.full_name}
          </Link>
        </p>
      )}
    </Card>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        'flex items-center gap-2 border-b-2 px-3 py-2 text-sm ' +
        (active ? 'border-accent font-medium text-ink' : 'border-transparent text-muted hover:text-ink')
      }
    >
      {children}
    </button>
  )
}
