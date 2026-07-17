import { notFound } from 'next/navigation'
import { getCompany, updateCompany } from '@/lib/actions/companies'
import { getTagsByCategory } from '@/lib/actions/tags'
import { CompanyForm } from '@/components/forms/CompanyForm'
import { PageHeader } from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [company, channelTags, classTags] = await Promise.all([
    getCompany(id),
    getTagsByCategory('recruiting_channel'),
    getTagsByCategory('contact_class'),
  ])
  if (!company) notFound()

  const action = updateCompany.bind(null, id)

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Company" title={`Edit ${company.name}`} />
      <CompanyForm company={company} channelTags={channelTags} classTags={classTags} action={action} />
    </div>
  )
}
