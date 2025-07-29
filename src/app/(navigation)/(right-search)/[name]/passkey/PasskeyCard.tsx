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
  const { deviceType, createdAt, transports, id } = passkey
  const { icon, label, bgColor } = getDeviceInfo(deviceType || '')
  const createdDate = createdAt ? new Date(createdAt) : null
  const relativeTime = createdDate ? getRelativeTime(createdDate) : null
  const truncatedId = getTruncatedId(id)
  const verificationMethod = getUserVerificationMethod(deviceType || '')

  return (
    <PasskeyMobileDeleteWrapper credentialId={passkey.id} username={username}>
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="shrink-0">
            <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center`}>{icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-base text-zinc-100 flex items-center gap-2">
                  {label}
                  {deviceType === 'platform' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-end/10 text-xs">
                      <IconShield className="h-3 w-3 text-brand-end" />
                      <span className="text-brand-end font-medium">보안</span>
                    </span>
                  )}
                </h3>
                {createdDate && (
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {relativeTime ||
                      createdDate.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                  </p>
                )}
              </div>
              <PasskeyDeleteButton
                className="p-2 text-zinc-500 hover:text-red-500 rounded-xl hover:bg-red-900/20 transition"
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
      </div>
    </PasskeyMobileDeleteWrapper>
  )
}

export function PasskeyCardSkeleton() {
  return (
    <div className=" h-[104px] sm:h-[112px] rounded-xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 animate-fade-in" />
  )
}
