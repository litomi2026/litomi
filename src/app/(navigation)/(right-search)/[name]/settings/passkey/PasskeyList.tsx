import { Passkey } from './common'
import PasskeyCard from './PasskeyCard'
import PasskeyEmptyState from './PasskeyEmptyState'
import PasskeyRegisterButton from './PasskeyRegisterButton'

type Props = {
  passkeys: Passkey[]
  username: string
}

export default function PasskeyList({ passkeys, username }: Readonly<Props>) {
  if (passkeys.length === 0) {
    return <PasskeyEmptyState />
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-zinc-200">등록된 패스키</h2>
          <p className="text-sm text-zinc-500 mt-1">{passkeys.length}개의 패스키가 등록되어 있어요</p>
        </div>
        <PasskeyRegisterButton />
      </div>
      <div className="grid gap-3">
        {passkeys.map((passkey) => (
          <PasskeyCard key={passkey.id} passkey={passkey} username={username} />
        ))}
      </div>
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-sm text-zinc-400 flex items-start">
          <span className="inline-block w-5 h-5 rounded bg-zinc-800 text-zinc-400 text-center leading-5 text-xs font-medium mr-2 flex-shrink-0">
            i
          </span>
          <span>여러 기기에서 패스키를 등록하면 어디서든 안전하게 로그인할 수 있어요</span>
        </p>
      </div>
    </div>
  )
}
