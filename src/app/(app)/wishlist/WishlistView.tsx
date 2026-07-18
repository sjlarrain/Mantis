'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createWishlist, setWishlistStatus, deleteWishlist } from '@/lib/actions/wishlist'
import type { WishlistItem } from '@/lib/actions/wishlist'
import type { Company, Tag } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Label } from '@/components/ui/Input'
import { Select, TagSelect } from '@/components/ui/Select'
import { Card, Badge, EmptyState } from '@/components/ui/Card'
import { formatDate } from '@/lib/format'

type CompanyOption = Pick<Company, 'id' | 'name'>

export function WishlistView({
  items,
  companies,
  statusTags,
}: {
  items: WishlistItem[]
  companies: CompanyOption[]
  statusTags: Tag[]
}) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-6">
      {adding ? (
        <AddForm companies={companies} statusTags={statusTags} onClose={() => setAdding(false)} />
      ) : (
        <Button size="sm" onClick={() => setAdding(true)}>
          Add position
        </Button>
      )}

      {items.length === 0 ? (
        <EmptyState title="No saved positions" hint="Track roles that look interesting and set a date to follow up." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <Row key={item.id} item={item} statusTags={statusTags} />
          ))}
        </ul>
      )}
    </div>
  )
}

function AddForm({
  companies,
  statusTags,
  onClose,
}: {
  companies: CompanyOption[]
  statusTags: Tag[]
  onClose: () => void
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    start(async () => {
      const res = await createWishlist(form)
      if (res.ok) {
        router.refresh()
        onClose()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <Card className="p-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Position title</Label>
          <Input id="title" name="title" required autoFocus />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="company_id">Company</Label>
            <Select id="company_id" name="company_id" defaultValue="">
              <option value="">—</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <TagSelect name="status_tag_id" label="Status" tags={statusTags} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="url">Link</Label>
            <Input id="url" name="url" placeholder="https://…" />
          </div>
          <div>
            <Label htmlFor="follow_up_on">Follow up on</Label>
            <Input id="follow_up_on" name="follow_up_on" type="date" />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" className="min-h-16" />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? 'Saving…' : 'Save position'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

function Row({ item, statusTags }: { item: WishlistItem; statusTags: Tag[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <li>
      <Card className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.title}</p>
            {item.company && (
              <Link href={`/companies/${item.company.id}`} className="text-sm text-accent-ink hover:underline">
                {item.company.name}
              </Link>
            )}
          </div>
          {item.follow_up_on && <Badge tone="attention">{formatDate(item.follow_up_on)}</Badge>}
        </div>

        {item.notes && <p className="line-clamp-3 text-sm text-muted">{item.notes}</p>}

        <div className="mt-auto flex items-center gap-2 pt-2">
          <Select
            className="h-8 max-w-40"
            defaultValue={item.status_tag_id ?? ''}
            onChange={(e) => start(() => setWishlistStatus(item.id, e.target.value || null).then(() => router.refresh()))}
          >
            <option value="">No status</option>
            {statusTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.value}
              </option>
            ))}
          </Select>
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-accent-ink hover:underline">
              Open
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            disabled={pending}
            onClick={() => {
              if (window.confirm('Remove this position?')) start(() => deleteWishlist(item.id).then(() => router.refresh()))
            }}
          >
            Remove
          </Button>
        </div>
      </Card>
    </li>
  )
}
