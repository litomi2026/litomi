import { cookies } from 'next/headers'

import type { PageProps } from '@/types/nextjs'

import { getUserIdFromAccessToken } from '@/utils/cookie'
import { getUsernameFromParam } from '@/utils/param'

import { getUserById } from '../common'
import PasswordChangeForm from './PasswordChangeForm'

type Params = {
  name: string
}

export default async function PasswordPage({ params }: PageProps<Params>) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  if (!userId) {
    return null
  }

  const [loginUser, { name }] = await Promise.all([getUserById(userId), params])
  const usernameFromParam = getUsernameFromParam(name)

  if (loginUser.name !== usernameFromParam) {
    return null
  }

  return (
    <div className="grid gap-6 p-4">
      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-semibold mb-2">비밀번호 변경</h1>
        <p className="text-zinc-400 text-sm mb-6">
          계정 보안을 위해 다른 사이트에서 사용하는 비밀번호와 다르게 설정하는 것을 권장해요
        </p>
        <PasswordChangeForm userId={userId} />
      </div>
    </div>
  )
}
