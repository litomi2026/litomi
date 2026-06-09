import { getTranslations } from 'next-intl/server'

import LinkPending from '@/components/LinkPending'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import SEOText from '@/components/SEOText'
import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

import CTAButton from './CTAButton'

export default async function Home({ params }: PageProps<'/[locale]'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Home.ageGate' })
  const linkClassName = 'border-2 rounded-lg w-60 py-2 font-semibold'

  return (
    <main className="h-dvh flex flex-col items-center justify-center gap-5 mx-auto p-4 text-center">
      <LocaleSwitcher className="fixed right-[calc(1rem+var(--safe-area-right))] top-[calc(0.75rem+var(--safe-area-top))] z-20" />
      <svg className="w-14 shrink-0" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="white" r="45" stroke="red" strokeWidth="10" />
        <text
          dominantBaseline="middle"
          fill="black"
          fontFamily="Arial"
          fontSize="40"
          fontWeight="bold"
          textAnchor="middle"
          x="50%"
          y="55"
        >
          19
        </text>
      </svg>
      <h1 className="text-lg font-bold max-w-prose">{t('warning')}</h1>
      <h2 className="max-w-prose">{t('description')}</h2>
      <div className="grid gap-2">
        <Link
          className={`${linkClassName} bg-brand-gradient relative text-background before:absolute before:inset-0 before:rounded-lg before:border-2 before:border-foreground/40`}
          href="/new/1"
        >
          {t('enterAction')}
          <LinkPending
            className="size-5 text-foreground"
            wrapperClassName="absolute inset-0 flex items-center justify-center rounded-md bg-background/50 animate-fade-in-fast"
          />
        </Link>
        <Link className={`${linkClassName} rounded`} href="/deterrence">
          {t('leaveAction')}
        </Link>
        <CTAButton className={linkClassName} />
      </div>
      <SEOText className="sr-only" />
    </main>
  )
}
