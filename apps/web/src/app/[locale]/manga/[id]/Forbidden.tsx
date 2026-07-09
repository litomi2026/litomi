import { ShieldAlert } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'
import { Link } from '@/i18n/navigation'

export default async function Forbidden() {
  const t = await getTranslations('MangaViewer.forbidden')
  const description = t('description').split('\n')

  return (
    <StatusState
      className="min-h-dvh"
      description={
        <>
          {description.map((line, index) => (
            <span key={line}>
              {index > 0 && <br className="hidden sm:block" />}
              {line}
            </span>
          ))}
        </>
      }
      icon={<ShieldAlert className="size-8" />}
      intent="blocked"
      title={t('title')}
    >
      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <StatusActionLink className="max-w-none" href="/new" variant="secondary">
          {t('newAction')}
        </StatusActionLink>
        <StatusActionLink className="max-w-none" href="/">
          {t('homeAction')}
        </StatusActionLink>
      </div>
      <p className="max-w-sm text-xs leading-5 text-zinc-600">
        {t('termsPrefix')}{' '}
        <Link className="text-zinc-500 underline underline-offset-2 transition hover:text-zinc-400" href="/doc/terms">
          {t('termsAction')}
        </Link>
        {t('termsSuffix')}
      </p>
    </StatusState>
  )
}
