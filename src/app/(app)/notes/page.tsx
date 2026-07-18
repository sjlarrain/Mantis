import { listAllNotes } from '@/lib/actions/notes'
import { listContacts } from '@/lib/actions/contacts'
import { PageHeader } from '@/components/PageHeader'
import { NotesView } from './NotesView'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const [all, contacts] = await Promise.all([listAllNotes(), listContacts()])
  // Inbox is the subset of all notes still awaiting a link.
  const inbox = all.filter((n) => n.status === 'inbox')

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Capture" title="Notes" />
      <NotesView
        inbox={inbox}
        all={all}
        contacts={contacts.map((c) => ({ id: c.id, full_name: c.full_name }))}
      />
    </div>
  )
}
