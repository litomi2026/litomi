'use client'

import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import PageHeader, { HeaderBackLink } from './ui/PageHeader'

// Creator-zone chrome: a fixed header (back to the fan zone) and the studio tab bar. It only
// depends on the URL, so it renders instantly and stays put while tab contents load.
export default function StudioShell({ handle, children }: { handle: string; children: ReactNode }) {
  const t = useTranslations('Sobok.studioShell')
  const pathname = usePathname()

  const base = `/sobok/studio/${handle}`

  const tabs = [
    { href: base, label: t('messages') },
    { href: `${base}/earnings`, label: t('earnings') },
    { href: `${base}/settings`, label: t('settings') },
  ] as const

  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader
        back={<HeaderBackLink href="/sobok" label={t('backToChat')} />}
        title={
          <h2 className="flex min-w-0 items-center gap-2 text-lg font-bold text-foreground">
            {t('title')}
            <span className="truncate text-sm font-normal text-zinc-500">@{handle}</span>
          </h2>
        }
      />

      <nav className="flex shrink-0 gap-1 border-b border-foreground/10 px-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href

          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className="border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-zinc-400 transition-colors hover:text-foreground aria-[current=page]:border-indigo-500 aria-[current=page]:text-foreground"
              href={tab.href}
              key={tab.href}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
