import { SHORT_NAME } from '@litomi/domain/app/metadata'
import { getUsernameFromParam } from '@litomi/std'
import { Metadata } from 'next'

import { defaultOpenGraph } from '@/lib/metadata'

import CensorAuthGate from './CensorAuthGate'

export const metadata: Metadata = {
  title: '검열',
  openGraph: {
    ...defaultOpenGraph,
    title: `검열 - ${SHORT_NAME}`,
    url: '/@/censor',
  },
  alternates: {
    canonical: '/@/censor',
    languages: { ko: '/@/censor' },
  },
}

export default async function Page({ params }: PageProps<'/[name]/censor'>) {
  const { name } = await params
  const usernameFromParam = getUsernameFromParam(name)

  return <CensorAuthGate username={usernameFromParam} />
}
