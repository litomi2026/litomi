import { Fingerprint, Lock, ScanFace, Shield } from 'lucide-react'

import Onboarding from '../Onboarding'
import { Passkey } from './common'
import PasskeyCard from './PasskeyCard'
import PasskeyInfoButton from './PasskeyInfoButton'
import PasskeyRegisterButton from './PasskeyRegisterButton'

type Props = {
  passkeys: Passkey[]
}

export default function PasskeyList({ passkeys }: Readonly<Props>) {
  if (passkeys.length === 0) {
    return (
      <Onboarding
        benefits={[
          {
            icon: <Shield className="size-5" />,
            title: '피싱 공격 차단',
            description: '가짜 사이트에서 절대 작동하지 않아요',
          },
          {
            icon: <ScanFace className="size-5" />,
            title: '한 번의 생체인증',
            description: '지문이나 얼굴로 즉시 로그인',
          },
          {
            icon: <Lock className="size-5" />,
            title: '비밀번호 불필요',
            description: '복잡한 비밀번호를 기억하지 않아도 돼요',
          },
        ]}
        description="패스키로 비밀번호 없이 안전하게 로그인하세요"
        icon={<Fingerprint className="size-12 text-brand-end" />}
        title="아직 패스키가 없어요"
      >
        <PasskeyRegisterButton />
      </Onboarding>
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
          <PasskeyRegisterButton />
          <PasskeyInfoButton />
        </div>
      </div>
      <div className="grid gap-3">
        {passkeys.map((passkey) => (
          <PasskeyCard key={passkey.id} passkey={passkey} />
        ))}
      </div>
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-sm text-zinc-400 flex items-start">
          <span className="inline-block w-5 h-5 rounded bg-zinc-800 text-zinc-400 text-center leading-5 text-xs font-medium mr-2 shrink-0">
            i
          </span>
          <span>여러 기기에서 패스키를 등록하면 어디서든 안전하게 로그인할 수 있어요</span>
        </p>
      </div>
    </div>
  )
}
