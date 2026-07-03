'use client'

import { useTranslations } from 'next-intl'

import AdultVerificationGate from '@/components/AdultVerificationGate'
import LoginGate from '@/components/LoginGate'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'

import Censorships from './Censorships'
import Loading from './loading'

export default function CensorAuthGate() {
  const { data: me } = useMeQuery()
  const t = useTranslations('Censorship')

  if (me === undefined) {
    return <Loading />
  }

  if (me === null) {
    return <LoginGate description={t('unauthorized.description')} />
  }

  if (!hasAdultAccess(me)) {
    return <AdultVerificationGate description={t('list.adultGateDescription')} />
  }

  return <Censorships />
}
