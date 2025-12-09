import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'
import { getUserIdFromCookie } from '@/utils/cookie'
import { getUsernameFromParam } from '@/utils/param'

import { getMe } from '../common'
import Forbidden from '../settings/Forbidden'
import PointsPageClient from './PointsPageClient'

export const metadata: Metadata = {
  title: '리보',
  ...generateOpenGraphMetadata({
    title: '리보',
  }),
}

export default async function PointsPage({ params }: PageProps<'/[name]/point'>) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return <Unauthorized />
  }

  const me = await getMe(userId)
  const { name } = await params
  const usernameFromParam = getUsernameFromParam(name)

  if (me.name !== usernameFromParam) {
    return <Forbidden loginUsername={me.name} />
  }

  return <PointsPageClient />
}

function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
      <h2 className="text-xl font-bold mb-2">로그인이 필요해요</h2>
      <p className="text-zinc-500">리보 정보를 확인하려면 로그인해 주세요</p>
    </div>
  )
}
