'use client'

import { ComponentProps, useState } from 'react'

import IconLogout from '../icons/IconLogout'
import Modal from '../ui/Modal'

type CopyStatus = 'error' | 'idle' | 'success'

export default function ShareButton(props: ComponentProps<'button'>) {
  const [isOpened, setIsOpened] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      console.error('링크 복사 실패:', error)
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  return (
    <>
      <button aria-label="공유하기" onClick={() => setIsOpened(true)} {...props}>
        <IconLogout className="w-6 rotate-270" />
      </button>
      <Modal onClose={() => setIsOpened(false)} open={isOpened} showCloseButton showDragButton>
        <div className="flex flex-col gap-2 p-4 border-2 bg-zinc-900 rounded-xl min-w-3xs max-w-prose">
          <h2 className="text-xl text-center py-2 font-semibold">공유하기</h2>
          <div className="text-sm text-center pb-2">
            {copyStatus === 'success' ? (
              <p className="text-green-400">링크가 복사되었어요</p>
            ) : copyStatus === 'error' ? (
              <p className="text-red-400">복사에 실패했어요</p>
            ) : (
              <p className="text-zinc-400">버튼을 눌러 복사해 보세요</p>
            )}
          </div>
          <button
            className="flex justify-center items-center gap-2 text-sm font-semibold rounded-full p-2 w-full transition border-2 hover:bg-zinc-800 active:bg-zinc-900 active:scale-95"
            onClick={handleCopy}
            type="button"
          >
            <IconLogout className="w-5 rotate-270" />
            링크 복사하기
          </button>
        </div>
      </Modal>
    </>
  )
}
