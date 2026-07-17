import { createContact } from '@/lib/actions/contacts'
import { listCompanies } from '@/lib/actions/companies'
import { getTagsByCategory } from '@/lib/actions/tags'
import { ContactForm } from '@/components/forms/ContactForm'
import { PageHeader } from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>
}) {
  const { company } = await searchParams
  const [companies, classTags, titleTags] = await Promise.all([
    listCompanies(),
    getTagsByCategory('contact_class'),
    getTagsByCategory('position_title'),
  ])

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Network" title="New person" />
      <ContactForm
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        classTags={classTags}
        titleTags={titleTags}
        showCompanyPicker
        defaultCompanyId={company}
        action={createContact}
      />
    </div>
  )
}
