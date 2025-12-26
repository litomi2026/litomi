import { ErrorBoundary } from '@suspensive/react'
import {
  CalendarMinus,
  CaseSensitive,
  Download,
  Fingerprint,
  Key,
  Languages,
  Palette,
  RectangleEllipsis,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { Suspense } from 'react'

import IconBell from '@/components/icons/IconBell'
import IconSpinner from '@/components/icons/IconSpinner'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import { getUserIdFromCookie } from '@/utils/cookie'
import { getUsernameFromParam } from '@/utils/param'

import { getMe } from '../common'
import AdultVerificationSection from './adult/AdultVerificationSection'
import DataExportSection from './data/DataExportSection'
import AccountDeletionForm from './delete/AccountDeletionForm'
import Forbidden from './Forbidden'
import InternalServerError from './InternalServerError'
import KeywordSettings from './keyword/KeywordSettings'
import LanguageSettings from './language/LanguageSettings'
import PasskeySettings from './passkey/PasskeySettings'
import PasswordChangeForm from './password/PasswordChangeForm'
import PrivacySettings from './privacy/PrivacySettings'
import PushSettings from './push/PushSettings'
import ThemeSettings from './theme/ThemeSettings'
import TwoFactorSettings from './two-factor/TwoFactorSettings'

export default async function SettingsPage({ params }: PageProps<'/[name]/settings'>) {
  const userId = await getUserIdFromCookie()

  const languageSelector = (
    <CollapsibleSection
      description="이 기기에서 사용할 언어를 선택하세요"
      icon={<Languages className="size-5 shrink-0 text-brand" />}
      id="language"
      title="언어"
    >
      <LanguageSettings />
    </CollapsibleSection>
  )

  const themeSelector = (
    <CollapsibleSection
      description="원하는 색상 테마를 선택하세요"
      icon={<Palette className="size-5 shrink-0 text-brand" />}
      id="theme"
      title="테마"
    >
      <ErrorBoundary fallback={InternalServerError}>
        <Suspense fallback={<LoadingFallback />}>
          <ThemeSettings />
        </Suspense>
      </ErrorBoundary>
    </CollapsibleSection>
  )

  if (!userId) {
    return (
      <>
        {languageSelector}
        {themeSelector}
      </>
    )
  }
  const { name } = await params
  const me = await getMe(userId)
  const usernameFromParam = getUsernameFromParam(name)

  if (me.name !== usernameFromParam) {
    return <Forbidden loginUsername={me.name} />
  }

  return (
    <>
      {languageSelector}
      {themeSelector}
      <CollapsibleSection
        description="관심 키워드를 등록하여 새로운 작품 알림을 받아보세요"
        icon={<CaseSensitive className="size-5 shrink-0 text-brand" />}
        id="keyword"
        title="키워드 알림"
      >
        <ErrorBoundary fallback={InternalServerError}>
          <Suspense fallback={<LoadingFallback />}>
            <KeywordSettings userId={userId} />
          </Suspense>
        </ErrorBoundary>
      </CollapsibleSection>
      <CollapsibleSection
        description="새로운 업데이트를 실시간으로 받아보세요"
        icon={<IconBell className="size-5 shrink-0 text-brand" />}
        id="push"
        title="푸시 알림"
      >
        <ErrorBoundary fallback={InternalServerError}>
          <Suspense fallback={<LoadingFallback />}>
            <PushSettings userId={userId} />
          </Suspense>
        </ErrorBoundary>
      </CollapsibleSection>
      <CollapsibleSection
        description="내 데이터를 백업할 수 있어요"
        icon={<Download className="size-5 shrink-0" />}
        id="data"
        title="데이터 내보내기"
      >
        <ErrorBoundary fallback={InternalServerError}>
          <Suspense fallback={<LoadingFallback />}>
            <DataExportSection userId={userId} />
          </Suspense>
        </ErrorBoundary>
      </CollapsibleSection>
      <CollapsibleSection
        description="비바톤으로 성인 인증 상태를 저장할 수 있어요"
        icon={<ShieldCheck className="size-5 shrink-0" />}
        id="adult"
        title="성인 인증"
      >
        <ErrorBoundary fallback={InternalServerError}>
          <Suspense fallback={<LoadingFallback />}>
            <AdultVerificationSection userId={userId} />
          </Suspense>
        </ErrorBoundary>
      </CollapsibleSection>
      <CollapsibleSection
        description="비밀번호 없이 안전하게 로그인하세요"
        icon={<Fingerprint className="size-5 shrink-0" />}
        id="passkey"
        title="패스키"
      >
        <ErrorBoundary fallback={InternalServerError}>
          <Suspense fallback={<LoadingFallback />}>
            <PasskeySettings userId={userId} />
          </Suspense>
        </ErrorBoundary>
      </CollapsibleSection>
      <CollapsibleSection
        description="로그인 시 추가 인증으로 계정을 보호하세요"
        icon={<RectangleEllipsis className="size-5 shrink-0" />}
        id="2fa"
        title="2단계 인증"
      >
        <ErrorBoundary fallback={InternalServerError}>
          <Suspense fallback={<LoadingFallback />}>
            <TwoFactorSettings userId={userId} />
          </Suspense>
        </ErrorBoundary>
      </CollapsibleSection>
      <CollapsibleSection
        description="개인정보 보호를 위해 계정 자동 삭제 기간을 관리하세요"
        icon={<CalendarMinus className="size-5 shrink-0" />}
        id="privacy"
        title="계정 자동 삭제"
      >
        <ErrorBoundary fallback={InternalServerError}>
          <Suspense fallback={<LoadingFallback />}>
            <PrivacySettings userId={userId} />
          </Suspense>
        </ErrorBoundary>
      </CollapsibleSection>
      <CollapsibleSection
        description="계정 보안을 위해 비밀번호를 변경하세요"
        icon={<Key className="size-5 shrink-0" />}
        title="비밀번호 변경"
      >
        <p className="text-zinc-400 text-sm mb-4 sm:mb-6">
          계정 보안을 위해 다른 사이트에서 사용하는 비밀번호와 다르게 설정하는 것을 권장해요
        </p>
        <PasswordChangeForm userId={userId} />
      </CollapsibleSection>
      <CollapsibleSection
        description="계정과 모든 데이터를 영구적으로 삭제해요"
        icon={<Trash2 className="size-5 shrink-0 text-red-500" />}
        title="계정 삭제"
        variant="danger"
      >
        <p className="text-zinc-400 text-sm mb-4 sm:mb-6">
          계정을 삭제하면 사용자 관련 모든 데이터가 영구적으로 삭제되고 복구할 수 없어요
        </p>
        <AccountDeletionForm loginId={me.loginId} />
      </CollapsibleSection>
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="animate-fade-in [animation-delay:0.5s] [animation-fill-mode:both]">
      <IconSpinner className="size-5 mx-auto" />
    </div>
  )
}
