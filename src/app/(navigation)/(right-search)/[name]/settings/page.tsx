import { cookies } from 'next/headers'

import type { PageProps } from '@/types/nextjs'

import IconKey from '@/components/icons/IconKey'
import IconTrash from '@/components/icons/IconTrash'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { getUsernameFromParam } from '@/utils/param'

import { getUserById } from '../common'
import AccountDeletionForm from './AccountDeletionForm'
import PasswordChangeForm from './PasswordChangeForm'
import SettingsForbidden from './SettingsForbidden'

type Params = {
  name: string
}

export default async function SettingsPage({ params }: PageProps<Params>) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  if (!userId) {
    return null
  }

  const [loginUser, { name }] = await Promise.all([getUserById(userId), params])
  const usernameFromParam = getUsernameFromParam(name)

  if (loginUser.name !== usernameFromParam) {
    return <SettingsForbidden loginUsername={loginUser.name} />
  }

  return (
    <div className="grid gap-4 p-4 max-w-2xl mx-auto w-full md:p-8 md:gap-6">
      <CollapsibleSection
        description="계정 보안을 위해 비밀번호를 변경하세요"
        icon={<IconKey className="w-5 flex-shrink-0 text-zinc-400" />}
        title="비밀번호 변경"
      >
        <p className="text-zinc-400 text-sm my-4">
          계정 보안을 위해 다른 사이트에서 사용하는 비밀번호와 다르게 설정하는 것을 권장해요
        </p>
        <PasswordChangeForm userId={userId} />
      </CollapsibleSection>
      <CollapsibleSection
        description="계정과 모든 데이터를 영구적으로 삭제해요"
        icon={<IconTrash className="w-5 flex-shrink-0 text-red-500" />}
        title="계정 삭제"
        variant="danger"
      >
        <p className="text-zinc-400 text-sm my-4">
          계정을 삭제하면 사용자 관련 모든 데이터가 영구적으로 삭제되고 복구할 수 없어요
        </p>
        <AccountDeletionForm loginId={loginUser.loginId} />
      </CollapsibleSection>
    </div>
  )
}
