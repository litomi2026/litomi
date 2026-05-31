import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import SexFortune from './SexFortune'

export async function generateMetadata({ params }: PageProps<'/[locale]/fortune'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.explore.fortune' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/fortune',
    }),
  }
}

export default function Page() {
  const todayKey = getSeoulDateKey(new Date())
  return <SexFortune todayKey={todayKey} />
}

function getSeoulDateKey(date: Date) {
  // NOTE: 한국 시간 기준으로 "오늘"이 바뀌어야 해요
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
