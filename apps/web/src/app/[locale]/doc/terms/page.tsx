import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

const EFFECTIVE_DATE = '2026-01-04'

export async function generateMetadata({ params }: PageProps<'/[locale]/doc/terms'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.doc.terms' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/doc/terms',
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/doc/terms'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Doc.terms' })
  const commonT = await getTranslations({ locale, namespace: 'Doc.common' })

  function emphasis(chunks: ReactNode) {
    return <span className="font-medium text-zinc-200">{chunks}</span>
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-prose mx-auto pb-safe px-safe">
        <header className="space-y-2">
          <Link
            className="inline-flex text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
            href="/new"
            prefetch={false}
          >
            {commonT('back')}
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{t('title')}</h1>
            <p className="mt-1 text-sm text-zinc-400">{t('subtitle')}</p>
          </div>
        </header>
        <nav aria-label={commonT('tocAria')} className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <p className="text-sm font-semibold text-zinc-200">{commonT('toc')}</p>
          <ol className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#purpose">
                {t('sections.purpose.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#definitions">
                {t('sections.definitions.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#service">
                {t('sections.service.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#ads">
                {t('sections.ads.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#libo">
                {t('sections.libo.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#browsers">
                {t('sections.browsers.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#dmca">
                {t('sections.dmca.title')}
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#liability">
                {t('sections.liability.title')}
              </a>
            </li>
          </ol>
        </nav>

        <article className="mt-8 space-y-10">
          <section className="space-y-3" id="purpose">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              {t('sections.purpose.title')}
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">{t('sections.purpose.p1')}</p>
          </section>

          <section className="space-y-3" id="definitions">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              {t('sections.definitions.title')}
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300 marker:text-zinc-600">
              <li>{t.rich('sections.definitions.items.user', { term: emphasis })}</li>
              <li>{t.rich('sections.definitions.items.service', { term: emphasis })}</li>
              <li>{t.rich('sections.definitions.items.advertising', { term: emphasis })}</li>
              <li>{t.rich('sections.definitions.items.libo', { term: emphasis })}</li>
            </ul>
          </section>

          <section className="space-y-3" id="service">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              {t('sections.service.title')}
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300 marker:text-zinc-600">
              <li>{t('sections.service.items.purpose')}</li>
              <li>{t('sections.service.items.changes')}</li>
            </ul>
          </section>

          <section className="space-y-3" id="ads">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              {t('sections.ads.title')}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>{t('sections.ads.items.display')}</li>
              <li>{t('sections.ads.items.networks')}</li>
              <li>{t('sections.ads.items.externalSites')}</li>
              <li>{t('sections.ads.items.riskReduction')}</li>
              <li>{t('sections.ads.items.koreaVerification')}</li>
            </ul>
          </section>

          <section className="space-y-3" id="libo">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              {t('sections.libo.title')}
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>{t('sections.libo.p1')}</p>
              <ul className="list-disc list-inside space-y-2 marker:text-zinc-600">
                <li>{t.rich('sections.libo.items.earn', { label: emphasis })}</li>
                <li>{t.rich('sections.libo.items.blocking', { label: emphasis })}</li>
                <li>{t.rich('sections.libo.items.abuse', { label: emphasis })}</li>
                <li>{t.rich('sections.libo.items.correction', { label: emphasis })}</li>
              </ul>
              <p className="text-xs text-zinc-500">{t('sections.libo.note')}</p>
            </div>
          </section>

          <section className="space-y-3" id="browsers">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              {t('sections.browsers.title')}
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">{t('sections.browsers.p1')}</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300 marker:text-zinc-600">
              <li>Chrome 109</li>
              <li>Edge 135</li>
              <li>Firefox 140</li>
              <li>Safari 16.6</li>
              <li>Chrome Android 131</li>
              <li>Firefox Android 138</li>
              <li>Samsung Internet 25</li>
              <li>iOS Safari 16.4</li>
            </ul>
          </section>

          <section className="space-y-3" id="dmca">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              {t('sections.dmca.title')}
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              {t.rich('sections.dmca.p1', {
                dmca: (chunks: ReactNode) => (
                  <Link
                    className="underline underline-offset-4 text-zinc-200 hover:text-zinc-100"
                    href="/doc/dmca"
                    prefetch={false}
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </section>

          <section className="space-y-3" id="liability">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              {t('sections.liability.title')}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>{t('sections.liability.items.thirdPartyDamage')}</li>
              <li>{t('sections.liability.items.adNetworkAvailability')}</li>
            </ul>
          </section>
        </article>

        <footer className="mt-10 border-t border-zinc-800 pt-6">
          <h3 className="text-center text-sm text-zinc-300">{commonT('effectiveDate', { date: EFFECTIVE_DATE })}</h3>
        </footer>
      </div>
    </div>
  )
}
