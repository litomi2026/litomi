import { APP_METADATA } from '@litomi/domain/app/metadata'
import { Locale, type PublicLocale } from '@litomi/domain/locale'
import { Download } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

import TopNavigationActions from './TopNavigationActions'

const PORN_DUDE_URL_BY_LOCALE = {
  [Locale.KO]: 'https://theporndude.com/ko',
  [Locale.EN]: 'https://theporndude.com/',
  [Locale.JA]: 'https://theporndude.com/ja',
  [Locale.ZH_CN]: 'https://theporndude.com/zh',
} satisfies Record<PublicLocale, string>

export default async function Layout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'TopNavigation.footer' })
  const shortName = APP_METADATA[locale].shortName
  const pornDudeUrl = PORN_DUDE_URL_BY_LOCALE[locale]

  return (
    <div className="flex flex-col flex-1 gap-2 px-2 pb-2">
      <TopNavigationActions locale={locale} />
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
        <p>© 2025 {shortName}. All rights reserved.</p>
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
        <div className="flex justify-center gap-2 gap-y-1 flex-wrap text-xs">
          <a className="hover:underline" href={pornDudeUrl} rel="nofollow sponsored noopener" target="_blank">
            ThePornDude
          </a>
          <a
            className="hover:underline"
            href="https://moemoekyu.com/"
            rel="nofollow sponsored noopener"
            target="_blank"
          >
            萌女仆导航
          </a>
        </div>
      </footer>
      <MobileNavigationSpacer />
    </div>
  )
}
