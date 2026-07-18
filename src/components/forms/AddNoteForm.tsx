'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createNote } from '@/lib/actions/notes'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'

// Add a note tied to a specific person.
export function AddNoteForm({ contactId }: { contactId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function save() {
    if (!body.trim()) return
    start(async () => {
      const res = await createNote({ body, contactId })
      if (res.ok) {
        setBody('')
        setError(null)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a note about this person…"
        className="min-h-16"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button size="sm" variant="secondary" onClick={save} disabled={pending || !body.trim()}>
        {pending ? 'Saving…' : 'Add note'}
      </Button>
    </div>
  )
}
