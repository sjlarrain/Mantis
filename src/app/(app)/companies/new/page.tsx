import { createCompany } from '@/lib/actions/companies'
import { getTagsByCategory } from '@/lib/actions/tags'
import { CompanyForm } from '@/components/forms/CompanyForm'
import { PageHeader } from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function NewCompanyPage() {
  const [channelTags, classTags] = await Promise.all([
    getTagsByCategory('recruiting_channel'),
    getTagsByCategory('contact_class'),
  ])

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Pipeline" title="New company" />
      <CompanyForm channelTags={channelTags} classTags={classTags} action={createCompany} />
    </div>
  )
}
