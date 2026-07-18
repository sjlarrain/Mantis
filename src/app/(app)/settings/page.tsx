import { listTags } from '@/lib/actions/tags'
import { listTokens } from '@/lib/actions/tokens'
import { TagManager } from './TagManager'
import { ApiTokens } from './ApiTokens'
import { SignOutButton } from './SignOutButton'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [tags, tokens] = await Promise.all([listTags(), listTokens()])

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="eyebrow">Configure</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1>
        </div>
        <SignOutButton />
      </header>

      <section>
        <p className="eyebrow mb-3">Tag manager</p>
        <p className="mb-4 max-w-prose text-sm text-muted">
          These values power every dropdown in the app. Rename them to match how you actually
          talk about your search; archive the ones you don&apos;t use.
        </p>
        <TagManager initialTags={tags} />
      </section>

      <section>
        <p className="eyebrow mb-3">API tokens</p>
        <ApiTokens initialTokens={tokens} />
      </section>
    </div>
  )
}
