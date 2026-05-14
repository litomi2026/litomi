'use client'

import { CheckCircle2, Compass, Download, Ellipsis, type LucideIcon, Share, SquarePlus } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'

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
  const [isIOS, setIsIOS] = useState(false)
  const [isIOSSafari, setIsIOSSafari] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

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
    return (
      <PromptPanel
        description="이미 홈 화면에 추가된 상태예요. 다음부터는 브라우저 대신 홈 화면 아이콘으로 바로 열면 됩니다."
        icon={CheckCircle2}
        title="이미 앱처럼 사용 중이에요"
      />
    )
  }

  if (isIOS && !isIOSSafari) {
    return (
      <PromptPanel
        description="iPhone과 iPad에서는 Safari에서만 홈 화면 추가가 안정적으로 보여요. 지금 페이지를 Safari에서 다시 연 뒤 설치를 진행해 주세요."
        icon={Compass}
        title="먼저 Safari에서 열어 주세요"
      />
    )
  }

  if (isIOS && isIOSSafari) {
    return (
      <div className="p-2">
        <div className="grid gap-1.5">
          <p className="text-sm font-semibold text-zinc-100">지금 Safari에서 열려 있어요</p>
          <p className="text-sm leading-6 text-zinc-400">
            아래 순서대로 진행하면 iPhone과 iPad에서도 비교적 자연스럽게 앱처럼 사용할 수 있어요.
          </p>
        </div>

        <ol className="mt-5 grid gap-2">
          <GuideStep Icon={Share} step="1">
            공유 버튼을 눌러요
          </GuideStep>
          <GuideStep Icon={SquarePlus} step="2">
            "홈 화면에 추가"를 고릅니다
          </GuideStep>
          <GuideStep Icon={CheckCircle2} step="3">
            추가 후 홈 화면 아이콘으로 다시 열어요
          </GuideStep>
        </ol>
      </div>
    )
  }

  if (deferredPrompt) {
    return (
      <div className="flex flex-col gap-4 p-2">
        <div className="grid gap-1.5">
          <p className="text-sm font-semibold text-zinc-100">브라우저가 웹앱 설치를 지원해요</p>
          <p className="text-sm leading-6 text-zinc-400">
            버튼을 누르면 브라우저의 설치 창이 바로 열려요. 설치 후에는 일반 앱처럼 홈 화면에서 실행할 수 있어요.
          </p>
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
          <Download className="size-4" />앱 설치하기
        </button>
      </div>
    )
  }

  return (
    <PromptPanel
      description='자동 설치 버튼이 바로 보이지 않으면 브라우저 메뉴에서 "앱 설치", "홈 화면에 추가", 또는 비슷한 항목을 찾아보세요.'
      icon={Ellipsis}
      title="브라우저 메뉴에서도 설치할 수 있어요"
    />
  )
}

function GuideStep({ children, step, Icon }: Readonly<InstallStepProps>) {
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

function PromptPanel({ description, icon: Icon, title }: Readonly<PromptPanelProps>) {
  return (
    <div className="flex items-start gap-3.5 p-2">
      <Icon className="size-5 text-zinc-200 shrink-0" />
      <div className="grid gap-1.5">
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <p className="text-sm leading-6 text-zinc-400">{description}</p>
      </div>
    </div>
  )
}
