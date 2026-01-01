import Link from 'next/link'
import { z } from 'zod'

import { submitDmcaCounterNotice } from '../actions'
import DmcaCounterFormClient from './DmcaCounterFormClient'

const searchParamsSchema = z.object({
  lang: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.enum(['ko', 'en']).catch('ko')).default('ko'),
  error: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().optional()),
})

type Lang = 'en' | 'ko'

const DMCA_EMAIL = 'litomi2026@gmail.com'

type FormCopy = {
  title: string
  claimantSection: string
  claimantName: string
  claimantEmail: string
  claimantAddress: string
  claimantPhone: string
  relatedSection: string
  relatedNoticeId: string
  infringingReferences: string
  infringingHelp: string
  claimSection: string
  claimDetails: string
  evidenceLinks: string
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
  backToNotice: string
  hint: string
  errorInvalid: string
  errorNoTarget: string
  errorServer: string
}

const pageCopy: Record<Lang, PageCopy> = {
  ko: {
    title: '이의제기',
    subtitle: '라이선스/권한이 있다고 주장하는 경우 제출해 주세요.',
    languageLabel: '언어',
    backToNotice: '저작권/DMCA 신고로 돌아가기 →',
    hint: `처리 중 추가 정보가 필요하면 ${DMCA_EMAIL} 메일에서 연락드릴 수 있어요.`,
    errorInvalid: '입력값을 다시 확인해 주세요.',
    errorNoTarget: '작품 URL 또는 작품 ID를 최소 1개 이상 적어 주세요.',
    errorServer: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
  },
  en: {
    title: 'Counter Notice',
    subtitle: 'If you believe you have a license/authorization, submit a counter notice here.',
    languageLabel: 'Language',
    backToNotice: 'Back to DMCA notice →',
    hint: `If we need more information, we may contact you via email. You can also reach us at ${DMCA_EMAIL}.`,
    errorInvalid: 'Please check your inputs and try again.',
    errorNoTarget: 'Please provide at least one Litomi URL or Manga ID.',
    errorServer: 'Something went wrong. Please try again later.',
  },
}

const formCopy: Record<Lang, FormCopy> = {
  ko: {
    title: '이의제기',
    claimantSection: '제출자 정보',
    claimantName: '이름',
    claimantEmail: '이메일',
    claimantAddress: '주소',
    claimantPhone: '전화번호',
    relatedSection: '관련 정보',
    relatedNoticeId: '관련 접수 번호 (선택)',
    infringingReferences: '리토미 작품 URL 또는 작품 ID',
    infringingHelp: '작품 URL에 /manga/숫자 가 포함돼 있으면 자동으로 인식해요. 여러 개면 줄바꿈으로 적어 주세요.',
    claimSection: '주장 내용',
    claimDetails: '라이선스/권한 근거',
    evidenceLinks: '증빙 링크 (선택)',
    statementsSection: '진술',
    goodFaith: '선의로 이의제기를 제출해요.',
    perjury: '위증 시 처벌을 받을 수 있음을 이해하고, 제출한 정보가 정확하다고 진술해요.',
    signature: '전자서명(성명)',
    submit: '제출',
  },
  en: {
    title: 'Counter Notice',
    claimantSection: 'Your information',
    claimantName: 'Full name',
    claimantEmail: 'Email',
    claimantAddress: 'Address',
    claimantPhone: 'Phone number',
    relatedSection: 'Related information',
    relatedNoticeId: 'Related case ID (optional)',
    infringingReferences: 'Litomi URLs or Manga IDs',
    infringingHelp:
      'If your URL contains /manga/{number}, it will be detected automatically. Use new lines for multiple items.',
    claimSection: 'Your claim',
    claimDetails: 'License/authorization basis',
    evidenceLinks: 'Evidence links (optional)',
    statementsSection: 'Statements',
    goodFaith: 'I submit this counter notice in good faith.',
    perjury: 'I swear, under penalty of perjury, that the information is accurate.',
    signature: 'Electronic signature (typed full name)',
    submit: 'Submit',
  },
}

export default async function Page({ searchParams }: PageProps<'/doc/dmca/counter'>) {
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
        <div className="flex items-center justify-end gap-2 text-xs">
          <span className="text-zinc-500">{t.languageLabel}</span>
          <Link
            aria-current={lang === 'ko' ? 'page' : undefined}
            className="rounded-full border border-zinc-800 px-2 py-1 hover:bg-zinc-900"
            href="/doc/dmca/counter?lang=ko"
            prefetch={false}
          >
            한국어
          </Link>
          <Link
            aria-current={lang === 'en' ? 'page' : undefined}
            className="rounded-full border border-zinc-800 px-2 py-1 hover:bg-zinc-900"
            href="/doc/dmca/counter?lang=en"
            prefetch={false}
          >
            English
          </Link>
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
            href={`/doc/dmca?lang=${lang}`}
            prefetch={false}
          >
            {t.backToNotice}
          </Link>
        </div>

        <p className="mt-3 text-sm text-zinc-400">{t.hint}</p>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="mt-6">
          <DmcaCounterFormClient dmcaEmail={DMCA_EMAIL} lang={lang} submitAction={submitDmcaCounterNotice} t={tForm} />
        </div>
      </div>
    </div>
  )
}
