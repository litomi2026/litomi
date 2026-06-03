import { Settings } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import IconBell from '@/components/icons/IconBell'
import { Link } from '@/i18n/navigation'

export default async function Layout({ children }: LayoutProps<'/[locale]/notification'>) {
  const t = await getTranslations('Community.notification')

  return (
    <>
      <div className="flex items-center gap-3 p-4 pt-safe mt-4">
        <IconBell className="size-9 p-2 bg-zinc-800/50 rounded-xl text-brand" />
        <div className="flex-1">
          <div className="w-full flex items-center justify-between gap-2">
            <h1 className="text-lg font-semibold text-foreground sm:text-xl">{t('layout.title')}</h1>
            <Link
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition"
              href="/settings#keyword"
              title={t('layout.settingsTitle')}
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{t('layout.description')}</p>
        </div>
      </div>
      {children}
    </>
  )
}
