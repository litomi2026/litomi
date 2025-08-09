import IconFingerprint from '@/components/icons/IconFingerprint'
import IconKey from '@/components/icons/IconKey'
import IconShield from '@/components/icons/IconShield'

import { Passkey } from './common'
import PasskeyDeleteButton from './PasskeyDeleteButton'
import PasskeyMobileDeleteWrapper from './PasskeyMobileDeleteWrapper'
import {
  getDeviceInfo,
  getRelativeTime,
  getTransportIcon,
  getTransportLabel,
  getTruncatedId,
  getUserVerificationMethod,
} from './utils'

type Props = {
  passkey: Passkey
  username: string
  enableMobileSwipe?: boolean
}

export default function PasskeyCard({ passkey, username }: Readonly<Props>) {
  const { deviceType, createdAt, lastUsedAt, transports, id } = passkey
  const { icon, label, bgColor } = getDeviceInfo(deviceType ?? '')
  const createdRelativeTime = getRelativeTime(createdAt)
  const lastUsedRelativeTime = getRelativeTime(lastUsedAt)
  const truncatedId = getTruncatedId(id)
  const verificationMethod = getUserVerificationMethod(deviceType ?? '')
  const isPlatform = deviceType === 'platform'

  return (
    <PasskeyMobileDeleteWrapper credentialId={passkey.id} username={username}>
      <div
        className="group relative bg-zinc-900 border-2 rounded-2xl p-5 data-[platform=true]:border-brand-end/40 border-zinc-800"
        data-platform={isPlatform}
      >
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center transition`}>{icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-medium text-base text-zinc-100 flex items-center gap-2">
                  {label}
                  {deviceType === 'platform' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-end/10 text-xs">
                      <IconShield className="h-3 w-3 text-brand-end" />
                      <span className="text-brand-end font-medium">보안</span>
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {lastUsedAt && <p className="text-sm text-zinc-400">{lastUsedRelativeTime} 사용</p>}
                  {createdAt && lastUsedAt && <span className="text-zinc-600">·</span>}
                  {createdAt && <p className="text-sm text-zinc-500">{createdRelativeTime} 등록</p>}
                </div>
              </div>
              <PasskeyDeleteButton
                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 rounded-xl hover:bg-red-900/10 transition-all"
                credentialId={passkey.id}
                username={username}
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2">
              {verificationMethod.requiresVerification && (
                <span className="flex items-center gap-1">
                  <IconFingerprint className="h-3.5 w-3.5" />
                  {verificationMethod.verificationLabel}
                </span>
              )}
              {transports && transports.length > 0 && (
                <span className="flex items-center gap-1">
                  {getTransportIcon(transports[0])}
                  {getTransportLabel(transports[0])}
                  {transports.length > 1 && ` +${transports.length - 1}`}
                </span>
              )}
              <span className="hidden md:flex items-center gap-1">
                <IconKey className="h-3.5 w-3.5" />
                {truncatedId}
              </span>
            </div>
          </div>
        </div>
        {isPlatform && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-end/80 to-transparent opacity-0 group-hover:opacity-100 transition" />
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
