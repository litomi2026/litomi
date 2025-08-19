'use client'

import { Check, Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import Modal from '@/components/ui/Modal'

type Props = {
  libraryId: number
  libraryName: string
}

export default function ShareLibraryButton({ libraryId, libraryName }: Readonly<Props>) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${origin}/library/public/${libraryId}`

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('링크 복사에 실패했어요')
    }
  }

  return (
    <>
      <button
        className="p-3 hover:bg-zinc-800 rounded-lg transition"
        onClick={() => setIsModalOpen(true)}
        title="서재 공유"
        type="button"
      >
        <Share2 className="size-5" />
      </button>
      <Modal onClose={() => setIsModalOpen(false)} open={isModalOpen}>
        <div className="grid gap-4 bg-zinc-900 w-screen max-w-md rounded-3xl border-2 p-6">
          <h2 className="text-xl font-bold">서재 공유</h2>
          <p className="text-sm text-zinc-400">이 서재는 링크를 통해 누구나 볼 수 있어요</p>
          <h3 className="font-medium text-center line-clamp-1 break-all">{libraryName}</h3>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 cursor-text select-all"
              onClick={(e) => e.currentTarget.select()}
              readOnly
              value={shareUrl}
            />
            <button
              className="px-4 py-2 rounded-lg bg-brand-end text-background hover:bg-brand-end/90 transition font-semibold flex items-center gap-2"
              onClick={handleCopyLink}
              type="button"
            >
              {isCopied ? (
                <>
                  <Check className="size-4" />
                  <span>완료</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>복사</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
