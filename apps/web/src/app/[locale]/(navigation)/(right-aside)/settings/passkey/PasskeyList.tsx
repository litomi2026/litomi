import { Fingerprint } from 'lucide-react'

import StatusState from '@/components/status/StatusState'

import type { Passkey, PasskeySignalData } from './common'
import PasskeyCard from './PasskeyCard'
import PasskeyInfoButton from './PasskeyInfoButton'
import PasskeyRegisterButton from './PasskeyRegisterButton'

type Props = {
  passkeySignalData: PasskeySignalData
  passkeys: Passkey[]
}

export default function PasskeyList({ passkeySignalData, passkeys }: Props) {
  if (passkeys.length === 0) {
    return (
      <StatusState
        description="패스키로 비밀번호 없이 안전하게 로그인하세요"
        icon={<Fingerprint className="size-8" />}
        intent="setup"
        title="아직 패스키가 없어요"
      >
        <PasskeyRegisterButton passkeySignalData={passkeySignalData} />
      </StatusState>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-zinc-200">등록된 패스키</h2>
          <p className="text-sm text-zinc-500 mt-1">{passkeys.length}개의 패스키가 등록되어 있어요</p>
        </div>
        <div className="flex items-center gap-2">
          <PasskeyRegisterButton passkeySignalData={passkeySignalData} />
          <PasskeyInfoButton />
        </div>
      </div>
      <div className="grid gap-3">
        {passkeys.map((passkey) => (
          <PasskeyCard key={passkey.id} passkey={passkey} passkeySignalData={passkeySignalData} />
        ))}
      </div>
      {passkeys.length === 1 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-sm text-zinc-400 flex items-start">
            <span className="inline-block w-5 h-5 rounded bg-zinc-800 text-zinc-400 text-center leading-5 text-xs font-medium mr-2 shrink-0">
              i
            </span>
            <span>다른 기기에도 패스키를 추가해 두면 현재 기기를 잃어버려도 계속 로그인할 수 있어요</span>
          </p>
        </div>
      )}
    </div>
  )
}
