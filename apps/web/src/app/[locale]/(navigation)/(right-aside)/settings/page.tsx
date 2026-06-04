import type { Metadata } from 'next'

import { getUserIdFromCookie } from '@litomi/auth/cookie'
import { db } from '@litomi/db/app'
import { twoFactorTable } from '@litomi/db/app/two-factor'
import { userTable } from '@litomi/db/app/user'
import { readUserSettings } from '@litomi/db/query/user-settings'
import { ErrorBoundary } from '@suspensive/react'
import { and, eq, isNull } from 'drizzle-orm'
import {
  CalendarMinus,
  CaseSensitive,
  Download,
  Fingerprint,
  Key,
  Languages,
  Loader2,
  MonitorSmartphone,
  Palette,
  RectangleEllipsis,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import IconBell from '@/components/icons/IconBell'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import AdultVerificationSection from './adult/AdultVerificationSection'
import ContentSettingsForm from './content/ContentSettingsForm'
import DataExportSection from './data/DataExportSection'
import AccountDeletionForm from './delete/AccountDeletionForm'
import InternalServerError from './InternalServerError'
import KeywordSettings from './keyword/KeywordSettings'
import LanguageSettings from './language/LanguageSettings'
import SearchLanguageSettings from './language/SearchLanguageSettings'
import PasskeySettings from './passkey/PasskeySettings'
import PasswordChangeForm from './password/PasswordChangeForm'
import AutoDeletionForm from './privacy/AutoDeletionForm'
import PushSettings from './push/PushSettings'
import SessionSettings from './session/SessionSettings'
import ThemeSettings from './theme/ThemeSettings'
import TwoFactorSettings from './two-factor/TwoFactorSettings'

export async function generateMetadata({ params }: PageProps<'/[locale]/settings'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.community.settings' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/settings',
    }),
  }
}

export default async function SettingsPage() {
  const userId = await getUserIdFromCookie()
  const t = await getTranslations('Settings')

  const languageSelector = (
    <CollapsibleSection
      description={t('sections.uiLanguage.description')}
      icon={<Languages className="size-5 shrink-0 text-brand" />}
      id="ui-language"
      title={t('sections.uiLanguage.title')}
    >
      <LanguageSettings />
    </CollapsibleSection>
  )

  const guestSearchLanguageSelector = (
    <CollapsibleSection
      description={t('sections.searchLanguage.description')}
      icon={<Search className="size-5 shrink-0 text-brand" />}
      id="search-language"
      title={t('sections.searchLanguage.title')}
    >
      <SearchLanguageSettings isAuthenticated={false} />
    </CollapsibleSection>
  )

  const themeSelector = (
    <CollapsibleSection
      description={t('sections.theme.description')}
      icon={<Palette className="size-5 shrink-0 text-brand" />}
      id="theme"
      title={t('sections.theme.title')}
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
        {guestSearchLanguageSelector}
        {themeSelector}
      </>
    )
  }

  const [[me], [isTwoFactorEnabled], settings] = await Promise.all([
    db
      .select({
        id: userTable.id,
        loginId: userTable.loginId,
        name: userTable.name,
        nickname: userTable.nickname,
        imageURL: userTable.imageURL,
      })
      .from(userTable)
      .where(eq(userTable.id, userId)),
    db
      .select({ userId: twoFactorTable.userId })
      .from(twoFactorTable)
      .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt))),
    readUserSettings(userId),
  ])

  return (
    <>
      {languageSelector}
      <CollapsibleSection
        description="새 검색어에 기본으로 추가할 작품 언어를 선택하세요"
        icon={<Search className="size-5 shrink-0 text-brand" />}
        id="search-language"
        title="검색 언어"
      >
        <SearchLanguageSettings initialSearchLanguage={settings.searchLanguage} isAuthenticated />
      </CollapsibleSection>
      {themeSelector}
      <CollapsibleSection
        description="관심 키워드를 등록하여 신작 알림을 받아보세요"
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
        description="감상 기록 저장과 광고 표시 방식을 관리하세요"
        icon={<Settings className="size-5 shrink-0" />}
        id="content"
        title="개인 설정"
      >
        <ContentSettingsForm initialSettings={settings} />
      </CollapsibleSection>
      <CollapsibleSection
        description="내 데이터를 다운로드할 수 있어요"
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
        description="비바톤에서 익명으로 성인 여부를 인증해요"
        icon={<ShieldCheck className="size-5 shrink-0" />}
        id="adult"
        title="익명 성인인증"
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
            <PasskeySettings displayName={me.nickname || me.name} loginId={me.loginId} userId={userId} />
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
        description="로그인 유지 중인 기기를 확인하고 종료하세요"
        icon={<MonitorSmartphone className="size-5 shrink-0" />}
        id="session"
        title="로그인 기기 관리"
      >
        <ErrorBoundary fallback={InternalServerError}>
          <Suspense fallback={<LoadingFallback />}>
            <SessionSettings userId={userId} />
          </Suspense>
        </ErrorBoundary>
      </CollapsibleSection>
      <CollapsibleSection
        description="개인정보 보호를 위해 계정을 자동으로 삭제하세요"
        icon={<CalendarMinus className="size-5 shrink-0" />}
        id="privacy"
        title="계정 자동 삭제"
      >
        <ErrorBoundary fallback={InternalServerError}>
          <Suspense fallback={<LoadingFallback />}>
            <AutoDeletionForm autoDeletionDay={settings.autoDeletionDay} />
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
        <PasswordChangeForm isTwoFactorEnabled={Boolean(isTwoFactorEnabled)} />
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
        <AccountDeletionForm isTwoFactorEnabled={Boolean(isTwoFactorEnabled)} loginId={me.loginId} />
      </CollapsibleSection>
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="animate-fade-in [animation-delay:0.5s] [animation-fill-mode:both]">
      <Loader2 className="size-5 mx-auto animate-spin" />
    </div>
  )
}
