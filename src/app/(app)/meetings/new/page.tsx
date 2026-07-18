import { listContacts } from '@/lib/actions/contacts'
import { listCompanies } from '@/lib/actions/companies'
import { getTagsByCategory } from '@/lib/actions/tags'
import { NewMeetingFlow } from '@/components/forms/NewMeetingFlow'
import { PageHeader } from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function NewMeetingPage() {
  const [contacts, companies, actionTypeTags, classTags, titleTags] = await Promise.all([
    listContacts(),
    listCompanies(),
    getTagsByCategory('action_type'),
    getTagsByCategory('contact_class'),
    getTagsByCategory('position_title'),
  ])

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Network" title="New meeting" />
      <NewMeetingFlow
        contacts={contacts.map((c) => ({ id: c.id, full_name: c.full_name, company: c.company }))}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        actionTypeTags={actionTypeTags}
        classTags={classTags}
        titleTags={titleTags}
      />
    </div>
  )
}
