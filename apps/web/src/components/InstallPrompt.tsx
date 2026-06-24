'use client'

import { CheckCircle2, Compass, Download, Ellipsis, type LucideIcon, Share, SquarePlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ReactNode, useEffect, useState } from 'react'

import { checkIOSDevice, checkIOSSafari } from '@/utils/browser'

declare global {
  export interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  prompt(): Promise<void>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

type InstallStepProps = {
  children: ReactNode
  Icon: LucideIcon
  step: string
}

type PromptPanelProps = {
  description: string
  icon: LucideIcon
  title: string
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOSSafari, setIsIOSSafari] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const t = useTranslations('AppInstall.pwa.prompt')

  useEffect(() => {
    setIsIOS(checkIOSDevice())
    setIsIOSSafari(checkIOSSafari())
  }, [])

  useEffect(() => {
    const checkStandalone = () => {
      const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches
      const legacyStandalone = 'standalone' in window.navigator && window.navigator.standalone === true
      setIsStandalone(standaloneMedia || legacyStandalone)
    }

    checkStandalone()
    window.addEventListener('focus', checkStandalone)
    return () => window.removeEventListener('focus', checkStandalone)
  }, [])

  useEffect(() => {
    const handler = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone) {
    return <PromptPanel description={t('standalone.description')} icon={CheckCircle2} title={t('standalone.title')} />
  }

  if (isIOS && !isIOSSafari) {
    return <PromptPanel description={t('iosBrowser.description')} icon={Compass} title={t('iosBrowser.title')} />
  }

  if (isIOS && isIOSSafari) {
    return (
      <div className="p-2">
        <div className="grid gap-1.5">
          <p className="text-sm font-semibold text-zinc-100">{t('iosSafari.title')}</p>
          <p className="text-sm leading-6 text-zinc-400">{t('iosSafari.description')}</p>
        </div>

        <ol className="mt-5 grid gap-2">
          <GuideStep Icon={Share} step="1">
            {t('iosSafari.steps.share')}
          </GuideStep>
          <GuideStep Icon={SquarePlus} step="2">
            {t('iosSafari.steps.addToHome')}
          </GuideStep>
          <GuideStep Icon={CheckCircle2} step="3">
            {t('iosSafari.steps.reopen')}
          </GuideStep>
        </ol>
      </div>
    )
  }

  if (deferredPrompt) {
    return (
      <div className="flex flex-col gap-4 p-2">
        <div className="grid gap-1.5">
          <p className="text-sm font-semibold text-zinc-100">{t('installable.title')}</p>
          <p className="text-sm leading-6 text-zinc-400">{t('installable.description')}</p>
        </div>

        <button
          className="inline-flex w-full items-center justify-center gap-2 self-start rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
          onClick={async () => {
            await deferredPrompt.prompt()
            await deferredPrompt.userChoice
            setDeferredPrompt(null)
          }}
          type="button"
        >
          <Download className="size-4" />
          {t('installable.action')}
        </button>
      </div>
    )
  }

  return <PromptPanel description={t('fallback.description')} icon={Ellipsis} title={t('fallback.title')} />
}

function GuideStep({ children, step, Icon }: InstallStepProps) {
  return (
    <li className="bg-zinc-950/85 p-2 relative pr-10">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-6 text-zinc-300">{children}</p>
        </div>
      </div>
      <Icon className="size-4 text-zinc-200 absolute top-1/2 -translate-y-1/2 right-4" />
    </li>
  )
}

function PromptPanel({ description, icon: Icon, title }: PromptPanelProps) {
  return (
    <div className="grid gap-2 p-2">
      <div className="flex items-start gap-3.5">
        <Icon className="size-5 text-zinc-200 shrink-0" />
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
      </div>
      <p className="text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  )
}
