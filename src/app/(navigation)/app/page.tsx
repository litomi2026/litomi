import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Apple, ArrowUpRight, Bot } from 'lucide-react'

import InstallPrompt from '@/components/InstallPrompt'
import { env } from '@/env/client'

export const metadata: Metadata = {
  title: '앱으로 사용하기',
  description: '리토미 앱 설치 방법을 환경별로 안내해요',
}

const ANDROID_APK_URL = 'https://github.com/gwak2837/litomi/releases/download/mobile-android-latest/litomi.apk'
const IOS_ALTSTORE_SOURCE_URL = 'https://raw.githubusercontent.com/gwak2837/litomi/main/mobile/altstore/source.json'
const { NEXT_PUBLIC_IOS_TESTFLIGHT_URL } = env

type ActionLinkProps = {
  children: ReactNode
  href: string
  variant: 'primary' | 'secondary'
}

type GuideStepProps = {
  children: ReactNode
  step: string
  title: string
}

type OptionCardProps = {
  badge?: string
  children: ReactNode
  description?: string
  title: string
}

export default function AppInstallPage() {
  return (
    <div className="p-safe mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-12">
      <div className="grid gap-3 sm:gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">앱 설치 안내</h1>
        <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
          사용 중인 기기에 맞는 설치 방법을 선택해 주세요.
        </p>
      </div>

      <div className="mt-4 grid gap-10 sm:mt-8 sm:gap-12">
        <section>
          <OptionCard badge="추천" title="웹앱 설치 (PWA)">
            <InstallPrompt />
          </OptionCard>
        </section>

        <section className="grid gap-4 sm:gap-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zinc-100">
            <Bot aria-hidden="true" className="size-5" /> Android
          </h2>
          <div className="grid gap-4 sm:gap-5">
            <OptionCard title="APK 앱 설치">
              <div className="mt-2 grid gap-4">
                <ActionLink href={ANDROID_APK_URL} variant="primary">
                  최신 APK 파일 다운로드
                </ActionLink>
                <div className="rounded-[1.1rem] border border-zinc-800 bg-zinc-900/50 p-4 text-sm leading-6 text-zinc-400">
                  설치가 막히면 기기 설정에서 <span className="font-medium text-zinc-200">알 수 없는 앱 설치</span>를 한
                  번 허용해 주세요.
                </div>
              </div>
            </OptionCard>
          </div>
        </section>

        <section className="grid gap-4 sm:gap-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zinc-100">
            <Apple aria-hidden="true" className="size-5" /> iOS (iPhone / iPad)
          </h2>
          <div className="grid gap-4 sm:gap-5">
            {NEXT_PUBLIC_IOS_TESTFLIGHT_URL && (
              <OptionCard description="TestFlight 앱을 통해 베타 버전을 설치합니다." title="TestFlight">
                <div className="mt-5">
                  <ActionLink href={NEXT_PUBLIC_IOS_TESTFLIGHT_URL} variant="primary">
                    TestFlight 열기
                  </ActionLink>
                </div>
              </OptionCard>
            )}

            <OptionCard title="IPA 앱 설치 (AltStore)">
              <div className="mt-2 grid w-full gap-4 overflow-hidden">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <ActionLink href={IOS_ALTSTORE_SOURCE_URL} variant="primary">
                    AltStore Source JSON 열기
                  </ActionLink>
                </div>
                <ol className="grid gap-4 p-1">
                  <GuideStep step="1" title="AltStore를 설치해요">
                    Mac 또는 Windows에서{' '}
                    <a className="font-medium text-zinc-200 underline" href="https://altstore.io" target="_blank">
                      AltServer
                    </a>
                    를 설치하고, iPhone/iPad에 <span className="font-medium text-zinc-200">AltStore</span>를 설치한 뒤,
                    설정에서 <span className="font-medium text-zinc-200">Apple ID 신뢰</span>와{' '}
                    <span className="font-medium text-zinc-200">개발자 모드</span>까지 마쳐 주세요.
                  </GuideStep>
                  <GuideStep step="2" title="AltStore에 리토미 소스를 추가해요">
                    AltStore의 <span className="font-medium text-zinc-200">Sources</span> 탭에서{' '}
                    <span className="font-medium text-zinc-200">Add Source</span>를 누른 뒤, 위의{' '}
                    <span className="font-medium text-zinc-200">Source JSON</span> 주소를 붙여 넣어요.
                  </GuideStep>
                  <GuideStep step="3" title="소스 안에서 리토미 앱을 설치해요">
                    추가된 리토미 소스를 열고 앱 카드의 설치 버튼을 누르면 기기에 내려받을 수 있어요.
                  </GuideStep>
                  <GuideStep step="4" title="만료 전에 새로 고침해요">
                    <span className="font-medium text-zinc-200">My Apps</span> 탭의{' '}
                    <span className="font-medium text-zinc-200">Refresh All</span>로 갱신할 수 있어요. 이때{' '}
                    <span className="font-medium text-zinc-200">AltServer</span>가 같은 Wi-Fi에 있거나 USB로 연결되어
                    있어야 해요.
                  </GuideStep>
                </ol>
                <div className="rounded-[1.1rem] border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-sm font-semibold text-zinc-100">자주 묻는 질문</p>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-400">
                    <li className="flex items-start gap-3">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-600" />
                      <span>무료 Apple 계정이면 앱이 7일마다 만료되기에 주기적으로 갱신해줘야 해요.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-zinc-600" />
                      <span>무료 계정 기준으로 AltStore에서 동시에 활성화할 수 있는 앱은 최대 3개예요.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </OptionCard>
          </div>
        </section>
      </div>
    </div>
  )
}

function ActionLink({ children, href, variant }: Readonly<ActionLinkProps>) {
  const className =
    variant === 'primary'
      ? 'bg-foreground text-background hover:opacity-90'
      : 'border border-zinc-700 bg-transparent text-foreground hover:bg-zinc-900/80'

  return (
    <a
      className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span>{children}</span>
      <span className="sr-only">(새 탭에서 열림)</span>
      <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
    </a>
  )
}

function GuideStep({ children, step, title }: Readonly<GuideStepProps>) {
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

function OptionCard({ badge, children, description, title }: Readonly<OptionCardProps>) {
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
