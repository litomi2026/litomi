'use client'

import { Check, Download } from 'lucide-react'
import { toast } from 'sonner'

import IconSpinner from '@/components/icons/IconSpinner'
import useActionResponse from '@/hook/useActionResponse'
import { downloadBlob } from '@/utils/download'

import { exportUserData } from './actions'

type Props = {
  hasExported: boolean
  onExportComplete: () => void
}

export default function ExportDataSection({ hasExported, onExportComplete }: Readonly<Props>) {
  const [_, dispatchAction, isPending] = useActionResponse({
    action: exportUserData,
    onSuccess: (data) => {
      const blob = new Blob([data], { type: 'application/json' })
      downloadBlob(blob, `litomi-${new Date().toISOString().split('T')[0]}.json`)
      onExportComplete()
      toast.success('데이터를 성공적으로 내보냈어요')
    },
    shouldSetResponse: false,
  })

  return (
    <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">데이터 백업</h2>
      <p className="text-zinc-400 mb-4">
        계정 삭제 전에 데이터를 내보내서 백업할 수 있어요. 내보낸 데이터에는 북마크, 검열 설정, 프로필 정보가 포함돼요.
      </p>
      <form action={dispatchAction}>
        <button
          className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 
            rounded-lg font-medium transition 
            flex items-center justify-center gap-2"
          disabled={isPending || hasExported}
          type="submit"
        >
          {isPending ? (
            <>
              <IconSpinner className="size-4" />
              내보내는 중...
            </>
          ) : hasExported ? (
            <>
              <Check className="size-4 text-green-500" />
              데이터 내보내기 완료
            </>
          ) : (
            <>
              <Download className="size-4" />
              데이터 내보내기
            </>
          )}
        </button>
      </form>
    </div>
  )
}
