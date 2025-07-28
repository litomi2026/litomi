import IconKey from '@/components/icons/IconKey'

import { Passkey } from './common'
import PasskeyCard from './PasskeyCard'
import PasskeyEmptyState from './PasskeyEmptyState'

type Props = {
  passkeys: Passkey[]
}

export default function PasskeyList({ passkeys }: Readonly<Props>) {
  if (passkeys.length === 0) {
    return <PasskeyEmptyState />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconKey className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-medium text-zinc-300">등록된 패스키</h2>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{passkeys.length}개</span>
        </div>
      </div>

      <div className="space-y-3">
        {passkeys.map((passkey) => (
          <PasskeyCard key={passkey.id} passkey={passkey} />
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-sm text-zinc-400">
          💡 <span className="font-medium">팁:</span> 여러 기기에서 패스키를 등록하면 어디서든 안전하게 로그인할 수
          있어요.
        </p>
      </div>
    </div>
  )
}
