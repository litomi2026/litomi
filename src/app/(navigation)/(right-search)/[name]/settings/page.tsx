import dynamic from 'next/dynamic'
import { cookies } from 'next/headers'
import { Suspense } from 'react'

import type { PageProps } from '@/types/nextjs'

import IconBell from '@/components/icons/IconBell'
import IconFingerprint from '@/components/icons/IconFingerprint'
import IconKey from '@/components/icons/IconKey'
import IconSearch from '@/components/icons/IconSearch'
import IconShield from '@/components/icons/IconShield'
import IconTrash from '@/components/icons/IconTrash'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { getUsernameFromParam } from '@/utils/param'

import { getUserById } from '../common'
import SettingsForbidden from './SettingsForbidden'

const AccountDeletionForm = dynamic(() => import('./delete/AccountDeletionForm'))
const PushSettings = dynamic(() => import('./push/PushSettings'))
const PasswordChangeForm = dynamic(() => import('./password/PasswordChangeForm'))
const KeywordSettings = dynamic(() => import('./keyword/KeywordSettings'))
const PrivacySettings = dynamic(() => import('./privacy/PrivacySettings'))
const PasskeySettings = dynamic(() => import('./passkey/PasskeySettings'))

type Params = {
  name: string
}

export default async function SettingsPage({ params }: PageProps<Params>) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  if (!userId) {
    return
  }

  const [loginUser, { name }] = await Promise.all([getUserById(userId), params])
  const usernameFromParam = getUsernameFromParam(name)

  if (loginUser.name !== usernameFromParam) {
    return <SettingsForbidden loginUsername={loginUser.name} />
  }

  return (
    <>
      <CollapsibleSection
        description="새로운 업데이트를 실시간으로 받아보세요"
        icon={<IconBell className="w-5 flex-shrink-0 text-brand-end" />}
        id="push"
        title="푸시 알림"
      >
        <Suspense>
          <PushSettings userId={userId} />
        </Suspense>
      </CollapsibleSection>
      <CollapsibleSection
        description="관심 키워드를 등록하여 새로운 작품 알림을 받아보세요"
        icon={<IconSearch className="w-5 flex-shrink-0 text-brand-end" />}
        id="keyword"
        title="키워드 알림"
      >
        <Suspense>
          <KeywordSettings userId={userId} />
        </Suspense>
      </CollapsibleSection>
      <CollapsibleSection
        description="비밀번호 없이 안전하게 로그인하세요"
        icon={<IconFingerprint className="w-5 flex-shrink-0 text-brand-end" />}
        id="passkey"
        title="패스키"
      >
        <Suspense>
          <PasskeySettings userId={userId} />
        </Suspense>
      </CollapsibleSection>
      <CollapsibleSection
        description="개인정보 보호를 위한 자동화 설정을 관리하세요"
        icon={<IconShield className="w-5 flex-shrink-0 text-brand-end" />}
        id="privacy"
        title="개인정보 보호"
      >
        <Suspense>
          <PrivacySettings userId={userId} />
        </Suspense>
      </CollapsibleSection>
      <CollapsibleSection
        description="계정 보안을 위해 비밀번호를 변경하세요"
        icon={<IconKey className="w-5 flex-shrink-0 text-zinc-400" />}
        title="비밀번호 변경"
      >
        <p className="text-zinc-400 text-sm mb-4 sm:mb-6">
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
        <p className="text-zinc-400 text-sm mb-4 sm:mb-6">
          계정을 삭제하면 사용자 관련 모든 데이터가 영구적으로 삭제되고 복구할 수 없어요
        </p>
        <AccountDeletionForm loginId={loginUser.loginId} />
      </CollapsibleSection>
    </>
  )
}
