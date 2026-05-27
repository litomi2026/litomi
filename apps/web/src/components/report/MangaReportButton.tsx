'use client'

import type { POSTV1MangaIdReportBody, POSTV1MangaIdReportResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { useMutation } from '@tanstack/react-query'
import { Flag } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

const MangaReportReason = {
  DEEPFAKE: 'DEEPFAKE',
  REAL_PERSON_MINOR: 'REAL_PERSON_MINOR',
} as const

type MangaReportReason = (typeof MangaReportReason)[keyof typeof MangaReportReason]

type Props = {
  mangaId: number
  className?: string
  labelClassName?: string
}

type ReasonButtonProps = {
  disabled: boolean
  label: string
  description?: string
  onClick: () => void
}

export default function MangaReportButton({ mangaId, className = '', labelClassName = '' }: Props) {
  const { guardAdultAccess, me } = useAdultAccessGuard()
  const [open, setOpen] = useState(false)
  const isAdultGateRequired = me?.adultVerification.required === true

  const reportMutation = useMutation<POSTV1MangaIdReportResponse, unknown, POSTV1MangaIdReportBody>({
    mutationFn: async (body) => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/manga/${mangaId}/report`

      const { data } = await fetchAPIData<POSTV1MangaIdReportResponse>(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      return data
    },
    onSuccess: (data) => {
      if (data.duplicated) {
        toast.info('이미 신고했어요')
      } else {
        toast.success('신고가 접수됐어요')
      }
    },
    onSettled: () => setOpen(false),
  })

  function openDialog(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

    if (!guardAdultAccess()) {
      return
    }

    setOpen(true)
  }

  return (
    <>
      <button
        aria-label="신고"
        className={twMerge(
          'flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/20 px-4 py-2 text-foreground transition',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 hover:bg-foreground/10',
          className,
        )}
        onClick={openDialog}
        type="button"
      >
        <Flag className="size-4" />
        <span className={twMerge('text-sm font-semibold hidden lg:inline', labelClassName)}>신고하기</span>
      </button>

      <Dialog ariaLabel="작품 신고" onClose={() => setOpen(false)} open={open}>
        <DialogHeader onClose={() => setOpen(false)} title="작품 신고" />
        <DialogBody className="p-2 space-y-2">
          <div className="grid gap-1">
            <ReasonButton
              disabled={reportMutation.isPending}
              label="실존 인물 딥페이크 같아요"
              onClick={() => reportMutation.mutate({ reason: MangaReportReason.DEEPFAKE })}
            />
            <ReasonButton
              disabled={reportMutation.isPending}
              label="미성년자로 보이는 실존 인물이 나와요"
              onClick={() => reportMutation.mutate({ reason: MangaReportReason.REAL_PERSON_MINOR })}
            />
          </div>
          <div className="grid gap-1 p-3 py-2 text-xs text-zinc-500">
            {isAdultGateRequired && (
              <p>
                <Link className="underline underline-offset-2" href={`/@${me?.name}/settings#adult`} prefetch={false}>
                  비바톤 익명 인증
                </Link>
                을 완료한 사용자만 신고할 수 있어요
              </p>
            )}
            <p>
              저작권/DMCA 신고는{' '}
              <Link className="underline underline-offset-2" href="/doc/dmca" prefetch={false}>
                여기에서
              </Link>{' '}
              할 수 있어요
            </p>
          </div>
        </DialogBody>
        <DialogFooter>
          <button
            className="w-full rounded-lg bg-zinc-800 px-4 py-3 font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:bg-zinc-700 disabled:text-zinc-500"
            disabled={reportMutation.isPending}
            onClick={() => setOpen(false)}
            type="button"
          >
            취소
          </button>
        </DialogFooter>
      </Dialog>
    </>
  )
}

function ReasonButton({ disabled, description, label, onClick }: ReasonButtonProps) {
  return (
    <button
      aria-disabled={disabled}
      className={twMerge(
        'flex w-full items-center gap-3 px-4 py-3 text-left rounded-xl transition',
        'hover:bg-zinc-800 active:bg-zinc-800/50',
        'aria-disabled:opacity-50 aria-disabled:pointer-events-none',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Flag className="size-5 text-zinc-400" />
      <div className="flex flex-col gap-0.5">
        <span>{label}</span>
        {description && <span className="text-xs text-zinc-500">{description}</span>}
      </div>
    </button>
  )
}
