import dayjs from 'dayjs'
import { twMerge } from 'tailwind-merge'

import type { Passkey, PasskeySignalData } from './common'

import PasskeyDeleteButton from './PasskeyDeleteButton'
import PasskeyMobileDeleteWrapper from './PasskeyMobileDeleteWrapper'
import PasskeyRenameButton from './PasskeyRenameButton'
import { getDeviceInfo, getPasskeyDisplayName, getRelativeTime, getUserVerificationMethod } from './utils'

type Props = {
  passkey: Passkey
  passkeySignalData: PasskeySignalData
}

export default function PasskeyCard({ passkey, passkeySignalData }: Props) {
  const { deviceType, createdAt, credentialId, lastUsedAt, id, name } = passkey
  const { icon, label, bgColor } = getDeviceInfo(deviceType ?? '')
  const createdRelativeTime = getRelativeTime(createdAt)
  const displayName = getPasskeyDisplayName(name, deviceType)
  const lastUsedLabel = lastUsedAt ? `${getRelativeTime(lastUsedAt)} 사용` : '아직 사용한 적 없음'
  const verificationMethod = getUserVerificationMethod(deviceType ?? '')

  return (
    <PasskeyMobileDeleteWrapper credentialId={credentialId} id={id} passkeySignalData={passkeySignalData}>
      <div className="group/card relative flex min-w-0 items-start gap-3 rounded-2xl border-2 border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700">
        <div className="relative shrink-0">
          <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center transition`}>{icon}</div>
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <h3 className="min-w-0 truncate text-base font-medium text-zinc-100" title={displayName}>
              {displayName}
            </h3>
            <div className="-my-2 -mr-1 flex shrink-0 items-center gap-1">
              <PasskeyRenameButton id={id} name={displayName} />
              <PasskeyDeleteButton
                className={twMerge('p-2 text-zinc-500 rounded-xl transition', 'hover:text-red-400 hover:bg-red-900/10')}
                credentialId={credentialId}
                id={id}
                passkeySignalData={passkeySignalData}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span
              className="text-zinc-400"
              title={lastUsedAt ? formatExactDateTitle('마지막 사용', lastUsedAt) : undefined}
            >
              {lastUsedLabel}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500" title={formatExactDateTitle('등록', createdAt)}>
              {createdRelativeTime} 등록
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 mt-1">
            <span>{label}</span>
            {verificationMethod && (
              <span className="flex items-center gap-1">
                {verificationMethod.icon}
                {verificationMethod.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </PasskeyMobileDeleteWrapper>
  )
}

export function PasskeyCardSkeleton() {
  return (
    <div className="h-[88px] rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 animate-pulse">
      <div className="p-5 flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-zinc-800 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function formatExactDateTitle(label: string, date: Date) {
  return `${label}: ${dayjs(date).format('YYYY년 M월 D일 HH:mm')}`
}
