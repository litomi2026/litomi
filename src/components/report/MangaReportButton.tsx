'use client'

import { useMutation } from '@tanstack/react-query'
import { Flag } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import type { POSTV1MangaIdReportBody, POSTV1MangaIdReportResponse } from '@/backend/api/v1/manga/[id]/report/POST'

import Dialog from '@/components/ui/Dialog'
import DialogHeader from '@/components/ui/DialogHeader'
import { env } from '@/env/client'
import { showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

const MangaReportReason = {
  DEEPFAKE: 'DEEPFAKE',
  REAL_PERSON_MINOR: 'REAL_PERSON_MINOR',
} as const

type MangaReportReason = (typeof MangaReportReason)[keyof typeof MangaReportReason]

type Props = {
  mangaId: number
  variant?: 'full' | 'icon'
  className?: string
}

type ReasonButtonProps = {
  disabled: boolean
  label: string
  description?: string
  onClick: () => void
}

export default function MangaReportButton({ mangaId, variant = 'icon', className = '' }: Props) {
  const { data: me } = useMeQuery()
  const [open, setOpen] = useState(false)

  const reportMutation = useMutation<POSTV1MangaIdReportResponse, unknown, POSTV1MangaIdReportBody>({
    mutationFn: async (body) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/report`
      const { data } = await fetchWithErrorHandling<POSTV1MangaIdReportResponse>(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return data
    },
    meta: {
      suppressGlobalErrorToastForStatuses: [403],
    },
    onSuccess: (data) => {
      if (data.duplicated) {
        toast.info('이미 신고했어요')
      } else {
        toast.success('신고가 접수됐어요')
      }
    },
    onError: (error) => {
      if (error instanceof ProblemDetailsError && error.status === 403) {
        const settingsHref = me?.name ? `/@${me.name}/settings#adult` : '/@/settings#adult'
        toast.warning(
          <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
            <div>비바톤 인증이 필요해요</div>
            {me?.name && (
              <Link className="font-bold text-xs underline underline-offset-2" href={settingsHref} prefetch={false}>
                인증하러 가기
              </Link>
            )}
          </div>,
        )
      }
    },
    onSettled: () => setOpen(false),
  })

  function openDialog(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

    if (!me) {
      showLoginRequiredToast()
      return
    }

    setOpen(true)
  }

  return (
    <>
      <button
        aria-label="신고"
        className={twMerge(
          'transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500',
          variant === 'icon'
            ? 'inline-flex items-center justify-center rounded-full p-2 hover:bg-zinc-500/20'
            : 'flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/20 px-4 py-2 text-foreground hover:bg-foreground/10',
          className,
        )}
        onClick={openDialog}
        type="button"
      >
        <Flag className="size-4" />
        {variant === 'full' && <span>신고</span>}
      </button>

      <Dialog ariaLabel="작품 신고" onClose={() => setOpen(false)} open={open}>
        <div className="flex flex-col h-full min-h-0">
          <DialogHeader onClose={() => setOpen(false)} title="작품 신고" />
          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            <div className="space-y-1">
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
              <p>
                <Link className="underline underline-offset-2" href={`/@${me?.name}/settings#adult`} prefetch={false}>
                  비바톤 익명 인증
                </Link>
                을 완료한 사용자만 신고할 수 있어요
              </p>
              <p>
                저작권/DMCA 신고는{' '}
                <Link className="underline underline-offset-2" href="/doc/dmca" prefetch={false}>
                  여기에서
                </Link>{' '}
                할 수 있어요
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}

function ReasonButton({ disabled, description, label, onClick }: ReasonButtonProps) {
  return (
    <button
      aria-disabled={disabled}
      className="flex w-full items-center gap-3 px-4 py-3 text-left rounded-xl transition
        hover:bg-zinc-800 active:bg-zinc-800/50
        aria-disabled:opacity-50 aria-disabled:pointer-events-none"
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
