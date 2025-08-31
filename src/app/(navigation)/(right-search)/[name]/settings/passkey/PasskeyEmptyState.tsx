import { Lock, ScanFace, Shield } from 'lucide-react'

import IconKey from '@/components/icons/IconKey'
import IconShield from '@/components/icons/IconShield'

import PasskeyRegisterButton from './PasskeyRegisterButton'

export default function PasskeyEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-8 relative">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-brand-end/20 to-brand-end/5 flex items-center justify-center">
          <IconKey className="h-12 w-12 text-brand-end" />
        </div>
        <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-zinc-900 border-2 border-background flex items-center justify-center">
          <IconShield className="h-5 w-5 text-brand-end" />
        </div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3">아직 패스키가 없어요</h2>
      <p className="text-base text-zinc-400 max-w-sm mb-8">패스키로 비밀번호 없이 안전하게 로그인하세요</p>
      <div className="w-full max-w-md space-y-3 mb-8">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="h-10 w-10 rounded-xl bg-brand-end/10 flex items-center justify-center flex-shrink-0">
            <Shield className="size-5" />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm mb-0.5">피싱 공격 차단</p>
            <p className="text-xs text-zinc-500">가짜 사이트에서 절대 작동하지 않아요</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="h-10 w-10 rounded-xl bg-brand-end/10 flex items-center justify-center flex-shrink-0">
            <ScanFace className="size-5" />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm mb-0.5">한 번의 생체인증</p>
            <p className="text-xs text-zinc-500">지문이나 얼굴로 즉시 로그인</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="h-10 w-10 rounded-xl bg-brand-end/10 flex items-center justify-center flex-shrink-0">
            <Lock className="size-5" />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm mb-0.5">비밀번호 불필요</p>
            <p className="text-xs text-zinc-500">복잡한 비밀번호를 기억하지 않아도 돼요</p>
          </div>
        </div>
      </div>
      <PasskeyRegisterButton />
    </div>
  )
}
