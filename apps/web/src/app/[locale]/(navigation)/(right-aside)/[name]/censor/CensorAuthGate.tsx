'use client'

import { useTranslations } from 'next-intl'

import AdultVerificationGate from '@/components/AdultVerificationGate'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'

import Censorships from './Censorships'
import Forbidden from './Forbidden'
import Loading from './loading'
import Unauthorized from './Unauthorized'

type Props = {
  username: string
}

export default function CensorAuthGate({ username }: Props) {
  const { data: me } = useMeQuery()
  const t = useTranslations('Censorship')

  if (me === undefined) {
    return <Loading />
  }

  if (me === null) {
    return <Unauthorized />
  }

  if (username && me.name !== username) {
    return <Forbidden loginUsername={me.name} />
  }

  if (!hasAdultAccess(me)) {
    return (
      <AdultVerificationGate
        description={t('list.adultGateDescription')}
        title={t('list.adultGateTitle')}
      />
    )
  }

  return <Censorships />
}
