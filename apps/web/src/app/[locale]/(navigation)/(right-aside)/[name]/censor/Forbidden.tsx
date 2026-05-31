import { LockKeyhole } from 'lucide-react'
import { useTranslations } from 'next-intl'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

type Props = {
  loginUsername: string
}

export default function Forbidden({ loginUsername }: Props) {
  const t = useTranslations('Censorship')

  return (
    <StatusState
      description={t('forbidden.description')}
      icon={<LockKeyhole className="size-8" />}
      title={t('forbidden.title')}
    >
      <StatusActionLink href={`/@${loginUsername}/censor`}>{t('forbidden.action')}</StatusActionLink>
    </StatusState>
  )
}
