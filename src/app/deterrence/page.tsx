import { ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'

import IconLogo from '@/components/icons/LogoLitomi'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'

const CONTACT_EMAIL = 'litomi2026@gmail.com'

const quickFacts = [
  {
    description: '청소년은 리토미 및 관련 성인 콘텐츠를 이용할 수 없습니다.',
    title: '19세 미만 이용 불가',
  },
  {
    description: '일부 기능과 흐름에는 성인인증 또는 추가 접근 제한이 적용될 수 있습니다.',
    title: '추가 확인이 필요할 수 있어요',
  },
  {
    description: '보호자는 사이트 안내문과 별개로 기기 수준의 차단 기능을 함께 설정해 주세요.',
    title: '보호자 설정이 중요해요',
  },
]

const guardianGuides = [
  {
    description: 'iPhone과 iPad에서 웹 콘텐츠 제한, 앱 제한, 자녀 기기 보호 설정을 관리할 수 있어요.',
    href: 'https://support.apple.com/en-us/108806',
    title: 'Apple Screen Time',
  },
  {
    description:
      'Google 검색의 SafeSearch와 Family Link를 통해 자녀 계정의 검색 결과와 일부 웹 접근을 관리할 수 있어요.',
    href: 'https://support.google.com/websearch/answer/510',
    title: 'Google SafeSearch',
  },
]

const disclaimers = [
  {
    body: '이 페이지는 일반적인 청소년 보호 및 보호자 안내를 위한 정보 제공용 문서입니다. 개별 상황에 대한 법률 자문을 대신하지 않습니다.',
    title: '법률 자문 대체 아님',
  },
  {
    body: '운영체제, 브라우저, 검색 서비스의 보호 기능은 각 제공자의 정책과 기기 환경에 따라 작동 방식이 달라질 수 있습니다.',
    title: '제3자 도구의 한계',
  },
  {
    body: '실제 기기 관리, 계정 통제, 보호자 비밀번호 설정과 사용 환경 관리는 이용자와 보호자의 책임 영역입니다.',
    title: '최종 관리 책임',
  },
]

const policyLinks = [
  { href: '/doc/youth-protection', label: '청소년보호정책' },
  { href: '/doc/privacy', label: '개인정보처리방침' },
  { href: '/doc/terms', label: '이용약관' },
]

export const metadata: Metadata = {
  title: '19세 미만 이용 제한 안내',
  description: '청소년 및 보호자를 위한 이용 제한 안내와 보호 기능 설정 방법을 안내합니다.',
  openGraph: {
    ...defaultOpenGraph,
    title: `19세 미만 이용 제한 안내 - ${SHORT_NAME}`,
    url: '/deterrence',
  },
  alternates: {
    canonical: '/deterrence',
    languages: { ko: '/deterrence' },
  },
}

export default async function Page() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 md:gap-5 md:px-8 md:py-8">
        <Link
          className="inline-flex items-center gap-2 self-start rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-foreground"
          href="/"
          prefetch={false}
        >
          <ArrowLeft className="size-4" />
          입구로 돌아가기
        </Link>

        <section className="px-0 py-1 md:rounded-4xl md:bg-zinc-900 md:px-8 md:py-8 md:shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300">
                <ShieldAlert className="size-3.5" />
                19+ 성인 전용
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-zinc-500 lg:justify-start">
                <IconLogo className="w-6" priority />
                <span>{SHORT_NAME}</span>
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground text-center md:text-5xl md:leading-tight lg:text-left">
                19세 미만은
                <br />
                여기서 멈춰주세요.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
                리토미는 성인 대상 콘텐츠를 포함하고 있어 19세 미만 청소년의 이용을 제한합니다. 청소년은 본 사이트와
                관련 성인 콘텐츠를 이용할 수 없으며, 일부 기능에는 추가적인 성인인증 또는 접근 제한이 적용될 수
                있습니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center justify-center rounded-2xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90"
                  href="/"
                  prefetch={false}
                >
                  입구로 돌아가기
                </Link>
                <a
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-800 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-zinc-700"
                  href="#guardians"
                >
                  보호자 안내 보기
                </a>
                <Link
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-800 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-zinc-700"
                  href="/doc/youth-protection"
                  prefetch={false}
                >
                  청소년보호정책
                </Link>
              </div>
            </div>

            <aside className="grid gap-3 self-start rounded-3xl bg-zinc-900 p-4 md:bg-zinc-800 md:p-5">
              <div className="grid gap-1">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Audience</div>
                <div className="text-sm font-medium text-foreground">19세 이상 성인</div>
              </div>
              <div className="grid gap-1">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Support</div>
                <div className="text-sm leading-6 text-zinc-400">보호자는 기기와 계정 설정을 함께 관리해 주세요.</div>
              </div>
              <div className="grid gap-1">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Contact</div>
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
          {quickFacts.map((item) => (
            <article className="rounded-3xl bg-zinc-900 px-4 py-4 shadow-sm md:px-5 md:py-5" key={item.title}>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]" id="guardians">
          <div className="px-0 py-1 md:rounded-4xl md:bg-zinc-900 md:px-8 md:py-8 md:shadow-sm">
            <div className="text-sm font-semibold text-zinc-500">Parents & Guardians</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-[2rem]">
              보호자라면 이렇게 관리해 주세요.
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400 md:text-base">
              사이트의 안내문만으로는 모든 접근을 막기 어렵습니다. 공용 기기, 자녀 계정, 검색 서비스, 보호자 비밀번호를
              함께 관리하는 방식이 가장 현실적이고 효과적입니다.
            </p>

            <ul className="mt-6 grid gap-3">
              <li className="rounded-2xl bg-zinc-900 px-4 py-4 md:bg-zinc-800">
                <div className="text-sm font-semibold text-foreground">
                  1. 자녀 전용 계정이나 프로필을 분리해 사용하세요.
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  공용 브라우저나 공용 계정은 우회 가능성을 높일 수 있어요.
                </p>
              </li>
              <li className="rounded-2xl bg-zinc-900 px-4 py-4 md:bg-zinc-800">
                <div className="text-sm font-semibold text-foreground">
                  2. 보호자 비밀번호와 기기 잠금을 함께 설정하세요.
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  방문 기록 삭제만 막는 것으로는 충분하지 않을 수 있어요.
                </p>
              </li>
              <li className="rounded-2xl bg-zinc-900 px-4 py-4 md:bg-zinc-800">
                <div className="text-sm font-semibold text-foreground">
                  3. 검색 필터와 기기 제한을 동시에 사용하세요.
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  검색 필터는 도움을 주지만, 모든 웹사이트를 완전히 차단하지는 않을 수 있습니다.
                </p>
              </li>
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
                    <div className="text-sm font-semibold text-foreground">{guide.title}</div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{guide.description}</p>
                  </div>
                  <ExternalLink className="mt-0.5 size-4 shrink-0 text-zinc-500 transition group-hover:text-zinc-300" />
                </div>
              </a>
            ))}

            <div className="rounded-3xl bg-zinc-900 px-4 py-5 shadow-sm md:px-6 md:py-6">
              <div className="text-sm font-semibold text-zinc-500">Docs & Contact</div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {policyLinks.map((item) => (
                  <Link
                    className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-zinc-700"
                    href={item.href}
                    key={item.href}
                    prefetch={false}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-5">
                <div className="text-sm text-zinc-400">청소년 보호, 접근 제한, 정책 관련 문의</div>
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
          <div className="text-sm font-semibold text-zinc-500">Notice</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">면책 및 유의사항</h2>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {disclaimers.map((item) => (
              <article className="rounded-2xl bg-zinc-900 px-4 py-5 md:bg-zinc-800" key={item.title}>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
