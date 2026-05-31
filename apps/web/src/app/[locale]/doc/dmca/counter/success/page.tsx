import { getTranslations } from 'next-intl/server'
import { z } from 'zod'

import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

const searchParamsSchema = z.object({
  case: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().uuid().optional()),
})

const DMCA_EMAIL = 'litomi2026@gmail.com'

export default async function Page({ params, searchParams }: PageProps<'/[locale]/doc/dmca/counter/success'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Doc.dmca.counter.success' })
  const parsed = searchParamsSchema.parse(await searchParams)

  return (
    <div className="p-4 md:p-16">
      <div className="max-w-prose mx-auto pb-safe px-safe">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-sm text-zinc-300">{t('body', { dmcaEmail: DMCA_EMAIL })}</p>

        {parsed.case && (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="text-xs text-zinc-400">{t('caseLabel')}</p>
            <p className="mt-1 font-mono text-sm text-zinc-100 break-all">{parsed.case}</p>
          </div>
        )}

        <div className="mt-8">
          <Link
            className="text-sm underline underline-offset-4 text-zinc-300 hover:text-zinc-100"
            href="/doc/dmca/counter"
            prefetch={false}
          >
            {t('back')}
          </Link>
        </div>
      </div>
    </div>
  )
}
