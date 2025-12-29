'use client'

import dayjs from 'dayjs'
import { Copy, ExternalLink, Magnet } from 'lucide-react'
import ms from 'ms'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { create } from 'zustand'

import type { Manga, MangaTorrent } from '@/types/manga'

import IconX from '@/components/icons/IconX'
import Modal from '@/components/ui/Modal'
import useClipboard from '@/hook/useClipboard'
import { formatBytes } from '@/utils/format/byte'
import { formatDistanceToNow } from '@/utils/format/date'

type MangaTorrentModalStore = {
  isOpen: boolean
  manga?: Manga
  open: (manga: Manga) => void
  close: () => void
}

const useMangaTorrentModalStore = create<MangaTorrentModalStore>()((set) => ({
  isOpen: false,
  manga: undefined,
  open: (manga) => set({ isOpen: true, manga }),
  close: () => {
    set({ isOpen: false })
    setTimeout(() => set({ manga: undefined }), 300)
  },
}))

export default function MangaTorrentModal() {
  const pathname = usePathname()
  const { copy } = useClipboard()
  const { isOpen, manga, close } = useMangaTorrentModalStore()
  const hasShownOpenHelpRef = useRef(false)
  const pathnameRef = useRef(pathname)
  const openAttemptCleanupRef = useRef<(() => void) | null>(null)

  const torrents = useMemo(() => {
    const list = manga?.torrents ?? []
    return [...list].sort((a, b) => b.added - a.added)
  }, [manga?.torrents])

  const torrentCount = torrents.length || manga?.torrentCount || 0

  function handleClickOpen() {
    if (hasShownOpenHelpRef.current) {
      return
    }

    // NOTE: `magnet:` 스키마는 브라우저가 직접 성공/실패를 알려주지 않아서
    // "클릭 후에도 포커스/가시성 변화가 없으면" 열리지 않은 것으로 추정해 안내 메시지를 띄움
    openAttemptCleanupRef.current?.()

    let isSettled = false
    let timerId: number | null = null

    function cleanup() {
      if (isSettled) {
        return
      }
      isSettled = true

      if (timerId !== null) {
        window.clearTimeout(timerId)
      }

      window.removeEventListener('blur', handleExternalOpen)
      window.removeEventListener('pagehide', handleExternalOpen)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      openAttemptCleanupRef.current = null
    }

    function handleExternalOpen() {
      cleanup()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        handleExternalOpen()
      }
    }

    window.addEventListener('blur', handleExternalOpen, { once: true })
    window.addEventListener('pagehide', handleExternalOpen, { once: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    timerId = window.setTimeout(() => {
      cleanup()

      if (hasShownOpenHelpRef.current) {
        return
      }

      if (document.visibilityState !== 'visible' || !document.hasFocus()) {
        return
      }

      hasShownOpenHelpRef.current = true
      toast.info('토렌트 앱이 열리지 않나요?', {
        description: '복사 버튼으로 마그넷 주소를 복사해 토렌트 앱에 붙여넣어 주세요',
      })
    }, ms('2 seconds'))

    openAttemptCleanupRef.current = cleanup
  }

  // NOTE: 모달이 열리면 현재 경로를 저장하고, 경로가 변경되면 모달을 닫음
  useEffect(() => {
    if (!isOpen) {
      pathnameRef.current = pathname
      return
    }

    if (pathnameRef.current !== pathname) {
      close()
    }

    pathnameRef.current = pathname
  }, [close, isOpen, pathname])

  // NOTE: 모달이 열리면 오픈 도움 메시지를 초기화
  useEffect(() => {
    if (isOpen) {
      hasShownOpenHelpRef.current = false
      openAttemptCleanupRef.current?.()
      openAttemptCleanupRef.current = null
    }
  }, [isOpen])

  return (
    <Modal
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-zinc-900 
        sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
        sm:w-full sm:max-w-prose sm:max-h-[calc(100dvh-4rem)] sm:rounded-xl sm:border-2"
      onClose={close}
      open={isOpen}
    >
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b-2 border-zinc-800 shrink-0">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-zinc-100">토렌트</h2>
          {manga && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 break-all">
              {manga.title} · 파일 {torrentCount}개
            </p>
          )}
        </div>
        <button
          className="p-2 -mr-2 rounded-lg hover:bg-zinc-800 transition sm:p-1.5 sm:-mr-1.5"
          onClick={close}
          title="닫기"
          type="button"
        >
          <IconX className="w-6 h-6 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!manga ? null : torrentCount === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">토렌트가 없어요</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-500">
              <span className="font-medium text-zinc-300">마그넷 열기</span>를 누르면 토렌트 앱이 실행될 수 있어요. 안
              열리면 <span className="font-medium text-zinc-300">복사</span>로 마그넷 주소를 복사해 주세요
            </p>
            <ul className="grid gap-2">
              {torrents.map((torrent) => {
                const magnet = createMagnetLink(torrent, manga.id)
                const addedDate = new Date(torrent.added * 1000)
                return (
                  <li className="rounded-xl border-2 border-zinc-800 bg-zinc-900 p-3" key={torrent.hash}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Magnet className="size-4 shrink-0 text-zinc-500 mt-0.5" />
                        <p className="text-sm font-medium text-zinc-100 break-all line-clamp-2">{torrent.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          className="inline-flex items-center gap-1 rounded-lg border-2 border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100
                            hover:bg-zinc-800 transition"
                          href={magnet}
                          onClick={handleClickOpen}
                          rel="noreferrer"
                        >
                          <ExternalLink className="size-3 text-zinc-300" />
                          열기
                        </a>
                        <button
                          className="inline-flex items-center gap-1 rounded-lg border-2 border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100
                            hover:bg-zinc-800 transition"
                          onClick={() => copy(magnet)}
                          type="button"
                        >
                          <Copy className="size-3 text-zinc-300" />
                          복사
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1" title={dayjs(addedDate).format('YYYY-MM-DD HH:mm:ss')}>
                      {formatDistanceToNow(addedDate)} · {formatBytes(torrent.fsize)}
                    </p>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </Modal>
  )
}

export function useMangaTorrentModal() {
  const open = useMangaTorrentModalStore((store) => store.open)
  return { open }
}

function createMagnetLink({ hash }: Pick<MangaTorrent, 'hash'>, mangaId: number): string {
  const trackerUrl = `http://ehtracker.org/${mangaId}/announce`
  return `magnet:?xt=urn:btih:${hash}&tr=${encodeURIComponent(trackerUrl)}`
}
