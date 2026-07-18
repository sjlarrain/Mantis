import { listWishlist } from '@/lib/actions/wishlist'
import { listCompanies } from '@/lib/actions/companies'
import { getTagsByCategory } from '@/lib/actions/tags'
import { PageHeader } from '@/components/PageHeader'
import { WishlistView } from './WishlistView'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const [items, companies, statusTags] = await Promise.all([
    listWishlist(),
    listCompanies(),
    getTagsByCategory('wishlist_status'),
  ])

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Opportunities" title="Wishlist" />
      <WishlistView
        items={items}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        statusTags={statusTags}
      />
    </div>
  )
}
