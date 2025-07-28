import IconFingerprint from '@/components/icons/IconFingerprint'
import IconKey from '@/components/icons/IconKey'
import IconShield from '@/components/icons/IconShield'

import { Passkey } from './common'
import PasskeyDeleteButton from './PasskeyDeleteButton'
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
}

export default function PasskeyCard({ passkey }: Readonly<Props>) {
  const { deviceType, createdAt, transports, id } = passkey
  const { icon, label, bgColor, description } = getDeviceInfo(deviceType || '')
  const createdDate = createdAt ? new Date(createdAt) : null
  const relativeTime = createdDate ? getRelativeTime(createdDate) : null
  const truncatedId = getTruncatedId(id)
  const verificationMethod = getUserVerificationMethod(deviceType || '')

  return (
    <div className="group relative rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-800/50">
      <div className="flex items-start gap-4">
        <div className={`rounded-lg p-3 ${bgColor}`}>{icon}</div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{label}</h3>
            {deviceType === 'platform' && (
              <span title="기기에 안전하게 저장됨">
                <IconShield className="h-4 w-4 text-green-500" />
              </span>
            )}
          </div>

          {description && <p className="text-xs text-zinc-500 mb-1">{description}</p>}

          <p className="text-sm text-zinc-400">
            {createdDate && (
              <>
                {createdDate.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {relativeTime && <span className="text-zinc-500"> · {relativeTime}</span>}
              </>
            )}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {verificationMethod.requiresVerification && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400"
                title={verificationMethod.verificationDescription}
              >
                <IconFingerprint className="h-3 w-3" />
                {verificationMethod.verificationLabel}
              </span>
            )}

            {transports?.map((transport) => (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400"
                key={transport}
              >
                {getTransportIcon(transport)}
                {getTransportLabel(transport)}
              </span>
            ))}

            <span
              className="inline-flex items-center gap-1 rounded-full bg-zinc-800/50 px-2 py-1 text-xs text-zinc-500"
              title={`전체 ID: ${passkey.id}`}
            >
              <IconKey className="h-3 w-3" />
              {truncatedId}
            </span>
          </div>
        </div>

        <PasskeyDeleteButton passkey={passkey} />
      </div>
    </div>
  )
}
