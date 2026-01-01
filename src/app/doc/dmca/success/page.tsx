import Link from 'next/link'
import { z } from 'zod'

const searchParamsSchema = z.object({
  lang: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.enum(['ko', 'en']).catch('ko')),
  case: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().uuid().optional()),
})

type Lang = 'en' | 'ko'

const DMCA_EMAIL = 'litomi2026@gmail.com'

const copy: Record<Lang, { title: string; body: string; caseLabel: string; back: string }> = {
  ko: {
    title: '접수됐어요',
    body: `신고가 접수됐어요. 필요하면 ${DMCA_EMAIL}로 접수 번호와 함께 연락해 주세요.`,
    caseLabel: '접수 번호',
    back: 'DMCA 페이지로 돌아가기',
  },
  en: {
    title: 'Submitted',
    body: `Your notice has been received. If you need to follow up, contact ${DMCA_EMAIL} with the case ID below.`,
    caseLabel: 'Case ID',
    back: 'Back to DMCA page',
  },
}

export default async function Page({ searchParams }: PageProps<'/doc/dmca/success'>) {
  const parsed = searchParamsSchema.parse(await searchParams)
  const lang = parsed.lang as Lang
  const t = copy[lang]

  return (
    <div className="p-4 md:p-16">
      <div className="max-w-prose mx-auto pb-safe px-safe">
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-sm text-zinc-300">{t.body}</p>

        {parsed.case && (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="text-xs text-zinc-400">{t.caseLabel}</p>
            <p className="mt-1 font-mono text-sm text-zinc-100 break-all">{parsed.case}</p>
          </div>
        )}

        <div className="mt-8">
          <Link
            className="text-sm underline underline-offset-4 text-zinc-300 hover:text-zinc-100"
            href={`/doc/dmca?lang=${lang}`}
            prefetch={false}
          >
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  )
}
