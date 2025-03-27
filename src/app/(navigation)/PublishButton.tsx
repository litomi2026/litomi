'use client'

import type { BaseParams } from '@/types/nextjs'

import { dict } from '@/common/dict'
import Modal from '@/components/Modal'
import { useAuthStore } from '@/model/auth'
import PenIcon from '@/svg/PenIcon'
import { useParams } from 'next/navigation'
import { useState } from 'react'

export default function PublishButton() {
  const [isOpened, setIsOpened] = useState(false)
  const { locale } = useParams<BaseParams>()
  const accessToken = useAuthStore((state) => state.accessToken)

  return (
    <>
      <div className="mx-auto my-4 hidden sm:block xl:mx-0">
        <button
          className="bg-midnight-500 focus-visible:outline-midnight-500 focus-visible:dark:outline-midnight-200 rounded-full p-3 outline-2 outline-transparent transition-opacity hover:opacity-80 focus:outline-none disabled:opacity-50 xl:hidden"
          onClick={() => setIsOpened(true)}
        >
          <PenIcon className="w-6 text-white" />
        </button>
        <button
          className="bg-midnight-500 focus-visible:outline-midnight-500 focus-visible:dark:outline-midnight-200 hidden w-11/12 rounded-full p-4 text-center text-lg leading-5 text-white transition-opacity hover:opacity-80 focus:outline-none xl:block"
          onClick={() => setIsOpened(true)}
        >
          {dict.게시하기[locale]}
        </button>
      </div>
      <Modal onClose={() => setIsOpened(false)} open={isOpened} showCloseButton showDragButton>
        <form className="dark:bg-midnight-900 rounded-2xl bg-white px-4 pb-4 pt-5 shadow-xl dark:border">
          <button disabled={!accessToken}>{dict.게시하기[locale]}</button>
          무슨 일이 일어나고 있나요?
        </form>
      </Modal>
    </>
  )
}
