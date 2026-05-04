'use client'

import { AlertTriangle, Check, Copy } from 'lucide-react'

import useClipboard from '@/hook/useClipboard'

interface Props {
  backupCodes: string[]
  onComplete: () => void
}

export default function TwoFactorBackupCodes({ backupCodes, onComplete }: Props) {
  const { copy, copied } = useClipboard()

  return (
    <div className="grid gap-6">
      <div className="rounded-lg bg-yellow-900/20 border border-yellow-800 p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="size-5 text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-500 mb-2">복구 코드를 안전하게 보관해주세요!</h3>
            <p className="text-sm text-zinc-400">
              이 코드는 인증 앱을 사용할 수 없을 때 로그인하는 데 사용됩니다. 각 코드는 한 번만 사용할 수 있으며, 이
              페이지를 떠나면 다시 볼 수 없습니다.
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-zinc-100">복구 코드</h3>
          <button
            className="flex items-center space-x-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
            onClick={() => copy(backupCodes.join('\n'))}
          >
            {copied ? (
              <>
                <Check className="size-4" />
                <span>복사됨</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>모두 복사</span>
              </>
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((code, index) => (
            <div className="font-mono text-sm text-zinc-300 bg-zinc-800 px-3 py-2 rounded" key={index}>
              {code}
            </div>
          ))}
        </div>
      </div>
      <button
        className="w-full rounded-lg bg-zinc-800 px-4 py-3 font-medium text-zinc-100 hover:bg-zinc-700"
        onClick={onComplete}
      >
        완료
      </button>
    </div>
  )
}
