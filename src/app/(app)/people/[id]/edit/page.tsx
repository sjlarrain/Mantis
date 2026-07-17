import { notFound } from 'next/navigation'
import { getContact, updateContact } from '@/lib/actions/contacts'
import { getTagsByCategory } from '@/lib/actions/tags'
import { ContactForm } from '@/components/forms/ContactForm'
import { PageHeader } from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [contact, classTags, titleTags] = await Promise.all([
    getContact(id),
    getTagsByCategory('contact_class'),
    getTagsByCategory('position_title'),
  ])
  if (!contact) notFound()

  const action = updateContact.bind(null, id)

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Person" title={`Edit ${contact.full_name}`} />
      <ContactForm
        contact={contact}
        companies={[]}
        classTags={classTags}
        titleTags={titleTags}
        showCompanyPicker={false}
        action={action}
      />
    </div>
  )
}
