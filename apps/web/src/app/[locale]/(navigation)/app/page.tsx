import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { env } from '@litomi/env/client'
import { Apple, ArrowUpRight, Bot } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import InstallPrompt from '@/components/InstallPrompt'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }: PageProps<'/[locale]/app'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.navigation.app' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/app',
    }),
  }
}

const ANDROID_APK_URL = 'https://github.com/litomi2026/litomi/releases/download/mobile-android-latest/litomi.apk'
const IOS_SOURCE_URL = 'https://raw.githubusercontent.com/litomi2026/litomi/main/apps/mobile/ios.source.json'
const IOS_SIDESTORE_SETUP_GUIDE_URL = 'https://docs.sidestore.io/ko/docs/installation/prerequisites'
const IOS_SIDESTORE_ADD_SOURCE_URL = `sidestore://source?url=${encodeURIComponent(IOS_SOURCE_URL)}`

type ActionLinkProps = {
  children: ReactNode
  external?: boolean
  externalLabel: string
  href: string
  variant: 'primary' | 'secondary'
}

type FaqItem = {
  content: ReactNode
  id: string
}

type GuideStepConfig = {
  content: ReactNode
  step: string
  title: string
}

type GuideStepProps = {
  children: ReactNode
  step: string
  title: string
}

type InstallAction = {
  external?: boolean
  href: string
  id: string
  label: string
  variant: 'primary' | 'secondary'
}

type InstallMethodOption = {
  actionHint?: ReactNode
  actions: InstallAction[]
  description?: ReactNode
  faqItems: FaqItem[]
  id: string
  steps: GuideStepConfig[]
  title: string
}

type OptionCardProps = {
  badge?: string
  children: ReactNode
  description?: ReactNode
  title: string
}

export default async function AppInstallPage({ params }: PageProps<'/[locale]/app'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'AppInstall' })
  const testFlightUrl = env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL

  const iosInstallOptions: InstallMethodOption[] = [
    {
      id: 'altstore',
      title: t('ios.altStore.title'),
      description: t('ios.altStore.description'),
      actions: [
        {
          href: IOS_SOURCE_URL,
          id: 'source-json',
          label: t('ios.actions.sourceJson'),
          variant: 'primary',
        },
      ],
      steps: [
        {
          step: '1',
          title: t('ios.altStore.steps.install.title'),
          content: t.rich('ios.altStore.steps.install.content', {
            altServer: (chunks: ReactNode) => (
              <a
                className="font-medium text-zinc-200 underline"
                href="https://altstore.io"
                rel="noopener noreferrer"
                target="_blank"
              >
                {chunks}
              </a>
            ),
            app: emphasis,
            developerMode: emphasis,
            trust: emphasis,
          }),
        },
        {
          step: '2',
          title: t('ios.altStore.steps.addSource.title'),
          content: t.rich('ios.altStore.steps.addSource.content', {
            addSource: emphasis,
            sourceJson: emphasis,
            sources: emphasis,
          }),
        },
        {
          step: '3',
          title: t('ios.altStore.steps.installApp.title'),
          content: t('ios.altStore.steps.installApp.content'),
        },
        {
          step: '4',
          title: t('ios.altStore.steps.refresh.title'),
          content: t.rich('ios.altStore.steps.refresh.content', {
            altServer: emphasis,
            myApps: emphasis,
            refreshAll: emphasis,
          }),
        },
      ],
      faqItems: [
        {
          id: 'altstore-refresh',
          content: t('ios.altStore.faq.refresh'),
        },
        {
          id: 'altstore-app-limit',
          content: t('ios.altStore.faq.appLimit'),
        },
      ],
    },
    {
      id: 'sidestore',
      title: t('ios.sideStore.title'),
      description: t.rich('ios.sideStore.description', {
        localDevVPN: emphasis,
      }),
      actions: [
        {
          external: false,
          href: IOS_SIDESTORE_ADD_SOURCE_URL,
          id: 'direct-add',
          label: t('ios.actions.sideStoreDirect'),
          variant: 'primary',
        },
        {
          href: IOS_SOURCE_URL,
          id: 'source-json',
          label: t('ios.actions.sourceJson'),
          variant: 'secondary',
        },
      ],
      actionHint: t.rich('ios.sideStore.actionHint', {
        directButton: emphasis,
      }),
      steps: [
        {
          step: '1',
          title: t('ios.sideStore.steps.install.title'),
          content: t.rich('ios.sideStore.steps.install.content', {
            localDevVPN: emphasis,
            pairingFile: emphasis,
            sideStore: (chunks: ReactNode) => (
              <a
                className="font-medium text-zinc-200 underline"
                href={IOS_SIDESTORE_SETUP_GUIDE_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                {chunks}
              </a>
            ),
          }),
        },
        {
          step: '2',
          title: t('ios.sideStore.steps.addSource.title'),
          content: t.rich('ios.sideStore.steps.addSource.content', {
            directButton: emphasis,
            sourceJson: emphasis,
            sources: emphasis,
          }),
        },
        {
          step: '3',
          title: t('ios.sideStore.steps.installApp.title'),
          content: t('ios.sideStore.steps.installApp.content'),
        },
        {
          step: '4',
          title: t('ios.sideStore.steps.refresh.title'),
          content: t.rich('ios.sideStore.steps.refresh.content', {
            localDevVPN: emphasis,
            myApps: emphasis,
            refreshAll: emphasis,
          }),
        },
      ],
      faqItems: [
        {
          id: 'sidestore-refresh',
          content: t('ios.sideStore.faq.refresh'),
        },
        {
          id: 'sidestore-app-limit',
          content: t('ios.sideStore.faq.appLimit'),
        },
      ],
    },
  ]

  function emphasis(chunks: ReactNode) {
    return <span className="font-medium text-zinc-200">{chunks}</span>
  }

  return (
    <div className="p-safe mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-12">
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">{t('description')}</p>
      </div>

      <div className="mt-4 grid gap-10 sm:mt-8 sm:gap-12">
        <section>
          <OptionCard badge={t('pwa.badge')} title={t('pwa.title')}>
            <InstallPrompt />
          </OptionCard>
        </section>

        <section className="grid gap-4 sm:gap-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zinc-100">
            <Bot aria-hidden="true" className="size-5" /> Android
          </h2>
          <div className="grid gap-4 sm:gap-5">
            <OptionCard title={t('android.apkTitle')}>
              <div className="mt-2 grid gap-4">
                <ActionLink externalLabel={t('common.externalSrOnly')} href={ANDROID_APK_URL} variant="primary">
                  {t('android.download')}
                </ActionLink>
                <div className="rounded-[1.1rem] border border-zinc-800 bg-zinc-900/50 p-4 text-sm leading-6 text-zinc-400">
                  {t.rich('android.unknownSourcesNote', {
                    setting: emphasis,
                  })}
                </div>
              </div>
            </OptionCard>
          </div>
        </section>

        <section className="grid gap-4 sm:gap-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zinc-100">
            <Apple aria-hidden="true" className="size-5" /> iOS
          </h2>
          <div className="grid gap-4 sm:gap-5">
            {testFlightUrl && (
              <OptionCard description={t('ios.testFlight.description')} title="TestFlight">
                <div className="mt-5">
                  <ActionLink externalLabel={t('common.externalSrOnly')} href={testFlightUrl} variant="primary">
                    {t('ios.testFlight.action')}
                  </ActionLink>
                </div>
              </OptionCard>
            )}
            {iosInstallOptions.map((option) => (
              <OptionCard description={option.description} key={option.id} title={option.title}>
                <div className="mt-2 grid w-full gap-4 overflow-hidden">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {option.actions.map((action) => (
                      <ActionLink
                        external={action.external}
                        externalLabel={t('common.externalSrOnly')}
                        href={action.href}
                        key={action.id}
                        variant={action.variant}
                      >
                        {action.label}
                      </ActionLink>
                    ))}
                  </div>
                  {option.actionHint && (
                    <div className="rounded-[1.1rem] border border-zinc-800 bg-zinc-900/50 p-4 text-sm leading-6 text-zinc-400">
                      {option.actionHint}
                    </div>
                  )}
                  <ol className="grid gap-4 p-1">
                    {option.steps.map((step) => (
                      <GuideStep key={step.step} step={step.step} title={step.title}>
                        {step.content}
                      </GuideStep>
                    ))}
                  </ol>
                  <FaqPanel items={option.faqItems} title={t('common.faqTitle')} />
                </div>
              </OptionCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ActionLink({ children, external = true, externalLabel, href, variant }: ActionLinkProps) {
  const className =
    variant === 'primary'
      ? 'bg-foreground text-background hover:opacity-90'
      : 'border border-zinc-700 bg-transparent text-foreground hover:bg-zinc-900/80'

  return (
    <a
      className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      href={href}
      rel={external ? 'noopener noreferrer' : undefined}
      target={external ? '_blank' : undefined}
    >
      <span>{children}</span>
      {external && <span className="sr-only">{externalLabel}</span>}
      <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
    </a>
  )
}

function FaqPanel({ items, title }: { items: FaqItem[]; title: string }) {
  return (
    <div className="rounded-[1.1rem] border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-sm font-semibold text-zinc-100">{title}</p>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-400">
        {items.map((item) => (
          <li className="flex items-start gap-3" key={item.id}>
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-600" />
            <span>{item.content}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function GuideStep({ children, step, title }: GuideStepProps) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200"
      >
        {step}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{children}</p>
      </div>
    </li>
  )
}

function OptionCard({ badge, children, description, title }: OptionCardProps) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
      <div className="flex w-full items-start justify-between gap-4 sm:gap-5">
        <div className="grid min-w-0 flex-1 gap-2.5">
          <h3 className="flex flex-wrap items-center gap-2 text-[1.15rem] font-semibold tracking-tight text-zinc-100">
            {badge && (
              <span className="w-fit rounded-full border border-zinc-700 bg-zinc-900/50 px-3 py-1 text-[11px] font-medium text-zinc-300">
                {badge}
              </span>
            )}
            {title}
          </h3>
        </div>
      </div>
      {description && <p className="mt-3 text-sm leading-7 text-zinc-400 sm:mt-4">{description}</p>}
      <div className="mt-auto pt-3 sm:pt-4">{children}</div>
    </div>
  )
}
