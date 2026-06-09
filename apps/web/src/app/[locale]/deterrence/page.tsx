import type { Metadata } from 'next'

import { APP_METADATA } from '@litomi/domain/app/metadata'
import { ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import IconLogo from '@/components/icons/LogoLitomi'
import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

const CONTACT_EMAIL = 'litomi2026@gmail.com'

const guardianGuides = [
  {
    href: 'https://support.apple.com/en-us/108806',
    key: 'appleScreenTime',
  },
  {
    href: 'https://support.google.com/websearch/answer/510',
    key: 'googleSafeSearch',
  },
] as const

const policyLinks = [
  { href: '/doc/youth-protection', key: 'youthProtection' },
  { href: '/doc/privacy', key: 'privacy' },
  { href: '/doc/terms', key: 'terms' },
] as const

const quickFactKeys = ['ageRestricted', 'additionalCheck', 'guardianSettings'] as const
const guardianStepKeys = ['separateProfiles', 'deviceLock', 'combinedFilters'] as const
const disclaimerKeys = ['legalAdvice', 'thirdPartyTools', 'finalResponsibility'] as const

export async function generateMetadata({ params }: PageProps<'/[locale]/deterrence'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.deterrence' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/deterrence',
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/deterrence'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Deterrence' })
  const shortName = APP_METADATA[locale].shortName

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 md:gap-5 md:px-8 md:py-8">
        <Link
          className="inline-flex items-center gap-2 self-start rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-foreground"
          href="/"
          prefetch={false}
        >
          <ArrowLeft className="size-4" />
          {t('actions.backHome')}
        </Link>

        <section className="px-0 py-1 md:rounded-4xl md:bg-zinc-900 md:px-8 md:py-8 md:shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300">
                <ShieldAlert className="size-3.5" />
                {t('hero.badge')}
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-zinc-500 lg:justify-start">
                <IconLogo className="w-6" priority />
                <span>{shortName}</span>
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground text-center md:text-5xl md:leading-tight lg:text-left">
                {t('hero.titleLine1')}
                <br />
                {t('hero.titleLine2')}
              </h1>

              <p className="mt-5 text-sm leading-7 text-zinc-400 md:text-base">{t('hero.description')}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center justify-center rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90"
                  href="/"
                  prefetch={false}
                >
                  {t('actions.backHome')}
                </Link>
                <a
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-800 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-zinc-700"
                  href="#guardians"
                >
                  {t('actions.guardianGuide')}
                </a>
                <Link
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-800 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-zinc-700"
                  href="/doc/youth-protection"
                  prefetch={false}
                >
                  {t('policyLinks.youthProtection')}
                </Link>
              </div>
            </div>

            <aside className="grid gap-3 self-start rounded-3xl bg-zinc-900 p-4 md:bg-zinc-800 md:p-5">
              <div className="grid gap-1">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {t('summary.audience.label')}
                </div>
                <div className="text-sm font-medium text-foreground">{t('summary.audience.value')}</div>
              </div>
              <div className="grid gap-1">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {t('summary.support.label')}
                </div>
                <div className="text-sm leading-6 text-zinc-400">{t('summary.support.description')}</div>
              </div>
              <div className="grid gap-1">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {t('summary.contact.label')}
                </div>
                <a
                  className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-zinc-300"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-3">
          {quickFactKeys.map((key) => (
            <article className="rounded-3xl bg-zinc-900 px-4 py-4 shadow-sm md:px-5 md:py-5" key={key}>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{t(`quickFacts.${key}.title`)}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{t(`quickFacts.${key}.description`)}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]" id="guardians">
          <div className="px-0 py-1 md:rounded-4xl md:bg-zinc-900 md:px-8 md:py-8 md:shadow-sm">
            <div className="text-sm font-semibold text-zinc-500">{t('guardian.eyebrow')}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-[2rem]">
              {t('guardian.title')}
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400 md:text-base">{t('guardian.description')}</p>

            <ul className="mt-6 grid gap-3">
              {guardianStepKeys.map((key) => (
                <li className="rounded-2xl bg-zinc-900 px-4 py-4 md:bg-zinc-800" key={key}>
                  <div className="text-sm font-semibold text-foreground">{t(`guardian.steps.${key}.title`)}</div>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{t(`guardian.steps.${key}.description`)}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            {guardianGuides.map((guide) => (
              <a
                className="group rounded-3xl bg-zinc-900 px-4 py-5 shadow-sm transition hover:bg-zinc-800 md:px-6 md:py-6"
                href={guide.href}
                key={guide.href}
                rel="noreferrer"
                target="_blank"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {t(`guardian.guides.${guide.key}.title`)}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {t(`guardian.guides.${guide.key}.description`)}
                    </p>
                  </div>
                  <ExternalLink className="mt-0.5 size-4 shrink-0 text-zinc-500 transition group-hover:text-zinc-300" />
                </div>
              </a>
            ))}

            <div className="rounded-3xl bg-zinc-900 px-4 py-5 shadow-sm md:px-6 md:py-6">
              <div className="text-sm font-semibold text-zinc-500">{t('docs.heading')}</div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {policyLinks.map((item) => (
                  <Link
                    className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-zinc-700"
                    href={item.href}
                    key={item.href}
                    prefetch={false}
                  >
                    {t(`policyLinks.${item.key}`)}
                  </Link>
                ))}
              </div>

              <div className="mt-5">
                <div className="text-sm text-zinc-400">{t('docs.inquiry')}</div>
                <a
                  className="mt-2 inline-flex text-base font-semibold text-foreground underline underline-offset-4 hover:text-zinc-300"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="px-0 py-1 md:rounded-4xl md:bg-zinc-900 md:px-8 md:py-8 md:shadow-sm">
          <div className="text-sm font-semibold text-zinc-500">{t('notice.eyebrow')}</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{t('notice.title')}</h2>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {disclaimerKeys.map((key) => (
              <article className="rounded-2xl bg-zinc-900 px-4 py-5 md:bg-zinc-800" key={key}>
                <h3 className="text-sm font-semibold text-foreground">{t(`notice.disclaimers.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{t(`notice.disclaimers.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
