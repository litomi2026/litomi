import { Metadata } from 'next'
import Link from 'next/link'
import { z } from 'zod'

import { CANONICAL_URL, defaultOpenGraph, SHORT_NAME } from '@/constants'

import DmcaNoticeFormClient from './DmcaNoticeFormClient'

export const metadata: Metadata = {
  title: '저작권/DMCA 신고',
  openGraph: {
    ...defaultOpenGraph,
    title: `저작권/DMCA 신고 - ${SHORT_NAME}`,
    url: `${CANONICAL_URL}/doc/dmca`,
  },
}

const searchParamsSchema = z.object({
  lang: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.enum(['ko', 'en']).catch('ko')).default('ko'),
  error: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional()),
})

type Lang = 'en' | 'ko'

const DMCA_EMAIL = 'litomi2026@gmail.com'
const DMCA_AGENT_NAME = 'litomi'
const DMCA_AGENT_REGISTRATION_NUMBER = 'DMCA-1069403'
const DMCA_AGENT_LAST_UPDATED = '2026-01-01'

type FormCopy = {
  noticeHeading: string
  reporterSection: string
  reporterName: string
  reporterEmail: string
  reporterAddress: string
  reporterPhone: string
  reporterRole: string
  reporterRoleOwner: string
  reporterRoleAgent: string
  workSection: string
  workDescription: string
  workURL: string
  infringingSection: string
  infringingReferences: string
  infringingPlaceholder: string
  infringingHelp: string
  statementsSection: string
  goodFaith: string
  perjury: string
  signature: string
  submit: string
}

type PageCopy = {
  title: string
  subtitle: string
  languageLabel: string
  noticeHeading: string
  fallbackHeading: string
  fallbackBody: string
  agentHeading: string
  agentBody: string
  slaBody: string
  counterLink: string
  formHint: string
  errorInvalid: string
  errorNoTarget: string
  errorServer: string
}

const pageCopy: Record<Lang, PageCopy> = {
  ko: {
    title: '저작권/DMCA 신고',
    subtitle: '권리자(또는 대리인) 통지 전용 폼이에요.',
    languageLabel: '언어',
    noticeHeading: '권리자 통지',
    fallbackHeading: '이 폼이 어려우신가요?',
    fallbackBody: `아래 메일로 보내 주셔도 돼요:`,
    agentHeading: 'DMCA 지정 대리인 정보',
    agentBody: `Service Provider: ${DMCA_AGENT_NAME} · Registration No: ${DMCA_AGENT_REGISTRATION_NUMBER} · Last Updated: ${DMCA_AGENT_LAST_UPDATED}`,
    slaBody: '접수된 통지는 보통 3일 이내에 처리하는 걸 목표로 해요.',
    counterLink: '라이선스가 있다고 주장하고 싶다면(이의제기) →',
    formHint: '정확한 처리를 위해 가능한 한 구체적으로 작성해 주세요. 허위 신고는 법적 책임이 발생할 수 있어요.',
    errorInvalid: '입력값을 다시 확인해 주세요.',
    errorNoTarget: '작품 URL 또는 작품 ID를 최소 1개 이상 적어 주세요.',
    errorServer: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
  },
  en: {
    title: 'Copyright / DMCA Notice',
    subtitle: 'This form is for copyright owners (or authorized agents).',
    languageLabel: 'Language',
    noticeHeading: 'Copyright Notice (DMCA-style)',
    fallbackHeading: 'Can’t use this form?',
    fallbackBody: `You can email us at:`,
    agentHeading: 'Designated DMCA Agent',
    agentBody: `Service Provider: ${DMCA_AGENT_NAME} · Registration No: ${DMCA_AGENT_REGISTRATION_NUMBER} · Last Updated: ${DMCA_AGENT_LAST_UPDATED}`,
    slaBody: 'We aim to process valid notices within 3 days.',
    counterLink: 'If you want to submit a counter notice (license/authorization claim) →',
    formHint: 'Please be as specific as possible. Submitting false information may result in legal liability.',
    errorInvalid: 'Please check your inputs and try again.',
    errorNoTarget: 'Please provide at least one Litomi URL or Manga ID.',
    errorServer: 'Something went wrong. Please try again later.',
  },
}

const formCopy: Record<Lang, FormCopy> = {
  ko: {
    noticeHeading: '권리자 통지',
    reporterSection: '신고자 정보',
    reporterName: '이름',
    reporterEmail: '이메일',
    reporterAddress: '주소',
    reporterPhone: '전화번호',
    reporterRole: '권한',
    reporterRoleOwner: '저작권자',
    reporterRoleAgent: '대리인',
    workSection: '저작물 식별',
    workDescription: '저작물 설명',
    workURL: '저작물 URL (선택)',
    infringingSection: '침해물 식별',
    infringingReferences: '리토미 작품 URL 또는 작품 ID',
    infringingPlaceholder: '예) https://litomi.in/manga/123\n123\nhttps://litomi.in/manga/456',
    infringingHelp: '작품 URL에 /manga/숫자 가 포함돼 있으면 자동으로 인식해요. 여러 개면 줄바꿈으로 적어 주세요.',
    statementsSection: '진술',
    goodFaith: '선의로 침해라고 믿고 이 통지를 제출해요.',
    perjury: '위증 시 처벌을 받을 수 있음을 이해하고, 권리자 또는 적법한 대리인임을 진술해요.',
    signature: '전자서명(성명)',
    submit: '제출',
  },
  en: {
    noticeHeading: 'Copyright Notice (DMCA-style)',
    reporterSection: 'Your information',
    reporterName: 'Full name',
    reporterEmail: 'Email',
    reporterAddress: 'Address',
    reporterPhone: 'Phone number',
    reporterRole: 'Role',
    reporterRoleOwner: 'Copyright owner',
    reporterRoleAgent: 'Authorized agent',
    workSection: 'Identify the copyrighted work',
    workDescription: 'Description',
    workURL: 'URL (optional)',
    infringingSection: 'Identify the infringing material on Litomi',
    infringingReferences: 'Litomi URLs or Manga IDs',
    infringingPlaceholder: 'e.g.\nhttps://litomi.in/manga/123\n123\nhttps://litomi.in/manga/456',
    infringingHelp:
      'If your URL contains /manga/{number}, it will be detected automatically. Use new lines for multiple items.',
    statementsSection: 'Statements',
    goodFaith:
      'I have a good-faith belief that the use is not authorized by the copyright owner, its agent, or the law.',
    perjury:
      'I swear, under penalty of perjury, that the information in this notice is accurate and that I am the owner or authorized to act on behalf of the owner.',
    signature: 'Electronic signature (typed full name)',
    submit: 'Submit',
  },
}

export default async function Page({ searchParams }: PageProps<'/doc/dmca'>) {
  const parsed = searchParamsSchema.parse(await searchParams)
  const lang = parsed.lang as Lang
  const t = pageCopy[lang]
  const tForm = formCopy[lang]

  const errorMessage =
    parsed.error === 'no-target'
      ? t.errorNoTarget
      : parsed.error === 'server'
        ? t.errorServer
        : parsed.error
          ? t.errorInvalid
          : null

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-prose mx-auto pb-safe px-safe">
        <div className="flex items-center justify-between">
          <Link
            className="inline-flex text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
            href="/new/1"
            prefetch={false}
          >
            ← 돌아가기
          </Link>
          <div className="flex items-center justify-end gap-2 text-xs">
            <span className="text-zinc-500">{t.languageLabel}</span>
            <Link
              aria-current={lang === 'ko' ? 'page' : undefined}
              className="rounded-full border border-zinc-800 px-2 py-1 hover:bg-zinc-900"
              href="/doc/dmca?lang=ko"
              prefetch={false}
            >
              한국어
            </Link>
            <Link
              aria-current={lang === 'en' ? 'page' : undefined}
              className="rounded-full border border-zinc-800 px-2 py-1 hover:bg-zinc-900"
              href="/doc/dmca?lang=en"
              prefetch={false}
            >
              English
            </Link>
          </div>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
            <p className="text-sm text-zinc-400">{t.subtitle}</p>
          </div>
        </div>

        <div className="mt-6">
          <Link
            className="text-sm underline underline-offset-4 text-zinc-300 hover:text-zinc-100"
            href={`/doc/dmca/counter?lang=${lang}`}
            prefetch={false}
          >
            {t.counterLink}
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <h2 className="text-base font-semibold mb-2">{t.agentHeading}</h2>
          <p className="text-xs text-zinc-400">{t.agentBody}</p>
          <p className="mt-2 text-sm text-zinc-300">{t.slaBody}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">{t.noticeHeading}</h2>
          <p className="text-sm text-zinc-400">{t.formHint}</p>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="mt-6">
          <DmcaNoticeFormClient dmcaEmail={DMCA_EMAIL} lang={lang} t={tForm} />
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <h2 className="text-base font-semibold mb-2">{t.fallbackHeading}</h2>
            <p className="text-sm text-zinc-300">
              {t.fallbackBody}{' '}
              <a className="underline underline-offset-2 text-zinc-200" href={`mailto:${DMCA_EMAIL}`}>
                {DMCA_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
