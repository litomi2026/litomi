'use client'

import { Dialog, DialogBody, DialogHeader } from '@litomi/ui'
import { Check, Copy, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  className?: string
  library: {
    id: number
    name: string
  }
}

export default function ShareLibraryButton({ className = '', library }: Props) {
  const { id, name } = library
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${origin}/library/${id}`
  const t = useTranslations('Library.share')

  function handleClose() {
    setIsModalOpen(false)
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error(t('copyError'))
    }
  }

  return (
    <>
      <button
        className={`hover:bg-zinc-800 rounded-lg transition ${className}`}
        onClick={() => setIsModalOpen(true)}
        title={t('title')}
        type="button"
      >
        <Share2 className="size-5" />
      </button>
      <Dialog ariaLabel={t('title')} onClose={handleClose} open={isModalOpen}>
        <DialogHeader onClose={handleClose} title={t('title')} />
        <DialogBody className="flex flex-col gap-4">
          <p className="text-sm text-zinc-400">{t('description')}</p>
          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <h3 className="font-medium text-center line-clamp-1 break-all text-zinc-100" title={name}>
              {name}
            </h3>
          </div>
          <div className="grid gap-2">
            <label className="block text-sm font-medium text-zinc-300">{t('linkLabel')}</label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 bg-zinc-800 rounded-lg border-2 border-zinc-700 text-zinc-100 cursor-text select-all outline-none focus:border-zinc-500 transition"
                onClick={(e) => e.currentTarget.select()}
                readOnly
                value={shareUrl}
              />
              <button
                className="px-4 py-2 rounded-lg bg-brand text-background hover:bg-brand/90 transition font-semibold flex items-center gap-2 whitespace-nowrap"
                onClick={handleCopyLink}
                type="button"
              >
                {isCopied ? (
                  <>
                    <Check className="size-4 shrink-0" />
                    <span>{t('done')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4 shrink-0" />
                    <span>{t('copy')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogBody>
      </Dialog>
    </>
  )
}
