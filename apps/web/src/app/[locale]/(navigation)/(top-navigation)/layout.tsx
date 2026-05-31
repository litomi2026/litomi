import { SHORT_NAME } from '@litomi/domain/app/metadata'
import { Download } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import ScrollButtons from '@/components/ScrollButtons'
import { MobileNavigationSpacer } from '@/components/ScrollSpacers'
import { Link } from '@/i18n/navigation'

import TopNavigationActions from './TopNavigationActions'

export default async function Layout({ children }: LayoutProps<'/[locale]'>) {
  const t = await getTranslations('TopNavigation.footer')

  return (
    <div className="flex flex-col flex-1 gap-2 px-2 pb-2">
      <TopNavigationActions />
      <main className="flex flex-col grow gap-2">{children}</main>
      <footer className="text-center grid gap-2 p-4 text-sm">
        <Link
          className="mx-auto text-foreground rounded-full border-2 border-brand-gradient hover:brightness-125 active:brightness-75 transition"
          href="/app"
          prefetch={false}
        >
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold">
            <Download className="size-5" />
            <span>{t('installApp')}</span>
          </div>
        </Link>
        <p>ⓒ 2025. {SHORT_NAME}. All rights reserved.</p>
        <div className="flex justify-center gap-2 gap-y-1 flex-wrap text-xs">
          <Link className="hover:underline" href="/doc/terms" prefetch={false}>
            {t('terms')}
          </Link>
          <Link className="hover:underline" href="/doc/privacy" prefetch={false}>
            {t('privacy')}
          </Link>
          <Link className="hover:underline" href="/deterrence" prefetch={false}>
            {t('ageRestriction')}
          </Link>
        </div>
        <div className="flex justify-center gap-2 gap-y-1 flex-wrap text-xs">
          <Link className="hover:underline" href="/doc/2257" prefetch={false}>
            {t('notice2257')}
          </Link>
          <Link className="hover:underline" href="/doc/dmca" prefetch={false}>
            {t('dmca')}
          </Link>
          <Link className="hover:underline" href="/doc/youth-protection" prefetch={false}>
            {t('youthProtection')}
          </Link>
        </div>
      </footer>
      <MobileNavigationSpacer />
      <ScrollButtons />
    </div>
  )
}
