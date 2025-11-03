import IconKey from '@/components/icons/IconKey'
import IconShield from '@/components/icons/IconShield'

import { Passkey } from './common'
import PasskeyDeleteButton from './PasskeyDeleteButton'
import PasskeyMobileDeleteWrapper from './PasskeyMobileDeleteWrapper'
import { getDeviceInfo, getRelativeTime, getTransportIcon, getTransportLabel, getUserVerificationMethod } from './utils'

type Props = {
  passkey: Passkey
  enableMobileSwipe?: boolean
}

export default function PasskeyCard({ passkey }: Readonly<Props>) {
  const { deviceType, createdAt, credentialId, lastUsedAt, transports, id } = passkey
  const { icon, label, bgColor } = getDeviceInfo(deviceType ?? '')
  const createdRelativeTime = getRelativeTime(createdAt)
  const lastUsedRelativeTime = lastUsedAt ? getRelativeTime(lastUsedAt) : null
  const verificationMethod = getUserVerificationMethod(deviceType ?? '')
  const isPlatform = deviceType === 'platform'

  return (
    <PasskeyMobileDeleteWrapper id={id}>
      <div
        className="flex items-start gap-3 group/card relative bg-zinc-900 border-2 rounded-2xl p-4 data-[platform=true]:border-brand/40 border-zinc-800"
        data-platform={isPlatform}
      >
        <div className="relative shrink-0">
          <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center transition`}>{icon}</div>
        </div>
        <div className="grid gap-1 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium text-base text-zinc-100 flex items-center gap-2">
              {label}
              {deviceType === 'platform' && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 text-xs">
                  <IconShield className="size-3 text-brand" />
                  <span className="text-brand font-medium">보안</span>
                </span>
              )}
            </h3>
            <PasskeyDeleteButton
              className="opacity-0 sm:opacity-100 -my-2 -mx-1 p-2 text-zinc-600 rounded-xl transition 
              hover:text-red-400 hover:bg-red-900/10 group-hover/card:opacity-100"
              id={id}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {lastUsedRelativeTime && (
              <p className="text-sm text-zinc-400">
                {lastUsedRelativeTime} <span className="hidden sm:inline">사용</span>
              </p>
            )}
            {createdAt && lastUsedRelativeTime && <span className="text-zinc-600">·</span>}
            {createdAt && (
              <p className="text-sm text-zinc-500">
                {createdRelativeTime} <span className="hidden sm:inline">등록</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
            {verificationMethod && (
              <span className="flex items-center gap-1">
                {verificationMethod.icon}
                {verificationMethod.label}
              </span>
            )}
            {transports && transports.length > 0 && (
              <span className="flex items-center gap-1">
                {getTransportIcon(transports[0])}
                {getTransportLabel(transports[0])}
                {transports.length > 1 && ` +${transports.length - 1}`}
              </span>
            )}
            <span className="hidden sm:flex items-center gap-1">
              <IconKey className="size-3" />
              {credentialId}
            </span>
          </div>
        </div>

        {isPlatform && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand/80 to-transparent opacity-0 group-hover/card:opacity-100 transition" />
        )}
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
