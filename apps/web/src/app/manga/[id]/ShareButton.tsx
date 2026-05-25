'use client'

import { Manga } from '@litomi/domain/manga/model'
import { Dialog, DialogBody, DialogHeader } from '@litomi/ui'
import { Check, Link, Share2, X } from 'lucide-react'
import { ComponentProps, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import LogoFacebook from '@/components/icons/LogoFacebook'
import LogoLine from '@/components/icons/LogoLine'
import LogoTelegram from '@/components/icons/LogoTelegram'
import LogoX from '@/components/icons/LogoX'

type CopyStatus = 'error' | 'idle' | 'success'

interface Props extends ComponentProps<'button'> {
  manga: Manga
}

type SharePlatform = {
  name: string
  icon: React.ComponentType<ComponentProps<'svg'>>
  color: string
  hoverColor: string
  action: (url: string, sharingText: string) => void
}

export default function ShareButton({ manga, className, ...props }: Props) {
  const [isOpened, setIsOpened] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const [supportsNativeShare, setSupportsNativeShare] = useState(false)

  async function handleNativeShare() {
    try {
      const sharingText = getSharingText(manga, 'native')

      await navigator.share({
        title: document.title,
        text: sharingText,
        url: window.location.href,
      })

      setIsOpened(false)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('handleNativeShare:', error)
      }
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      console.error('handleCopy:', error)
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  // NOTE: Share API 지원 여부를 확인해요
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      setSupportsNativeShare(true)
    }
  }, [])

  return (
    <>
      <button
        className={twMerge('flex gap-2 items-center', className)}
        onClick={() => setIsOpened(true)}
        title="공유하기"
        {...props}
      >
        <Share2 className="size-6" />
        <span className="text-sm font-semibold hidden lg:inline">공유하기</span>
      </button>
      <Dialog ariaLabel="공유하기" onClose={() => setIsOpened(false)} open={isOpened}>
        <DialogHeader onClose={() => setIsOpened(false)} title="공유하기" />
        <DialogBody className="flex flex-col gap-4 sm:p-6">
          {supportsNativeShare && (
            <>
              <button
                aria-label="기기 공유"
                className="flex justify-center items-center gap-2 text-sm font-semibold rounded-xl p-3 w-full transition bg-zinc-800 hover:bg-zinc-700 active:scale-98"
                onClick={handleNativeShare}
                type="button"
              >
                <Share2 className="size-5" />
                기기 공유
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-zinc-700" />
                <span className="text-xs text-zinc-500">또는</span>
                <div className="flex-1 border-t border-zinc-700" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {sharePlatforms.map((platform) => {
              const Icon = platform.icon
              return (
                <button
                  aria-label={`${platform.name}에 공유하기`}
                  className={`flex flex-col items-center justify-center gap-2 p-2 sm:p-4 rounded-xl ${platform.color} ${platform.hoverColor} transition active:scale-95 touch-manipulation`}
                  key={platform.name}
                  onClick={() => {
                    const sharingText = getSharingText(manga, platform.name.toLowerCase())
                    platform.action(window.location.href, sharingText)
                  }}
                  type="button"
                >
                  <Icon className="size-6 sm:size-7" />
                  <span className="text-xs font-medium">{platform.name}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm text-center h-5">
              {copyStatus === 'success' ? (
                <p className="inline-flex items-center justify-center gap-1.5 text-green-400 font-medium">
                  <Check aria-hidden className="size-4 shrink-0" />
                  링크가 복사되었어요
                </p>
              ) : copyStatus === 'error' ? (
                <p className="inline-flex items-center justify-center gap-1.5 text-red-400 font-medium">
                  <X aria-hidden className="size-4 shrink-0" />
                  복사에 실패했어요
                </p>
              ) : (
                <p className="text-zinc-500">링크 복사</p>
              )}
            </div>
            <button
              aria-label="링크 복사하기"
              className="flex justify-center items-center gap-2 text-sm font-semibold rounded-xl p-3 w-full transition border-2 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 active:scale-95 touch-manipulation"
              onClick={handleCopy}
              type="button"
            >
              <Link className="size-5" />
              링크 복사하기
            </button>
          </div>
        </DialogBody>
      </Dialog>
    </>
  )
}

function getSharingText(manga: Manga, platform: string): string {
  const { title } = manga

  // Platform-specific templates optimized for engagement based on viral content research
  // Patterns: Brevity (< 20 words), Emotional hooks, 1-2 emojis, Korean colloquial language
  const templates = {
    x: [
      // Curiosity hook - highest CTR pattern
      (t: string) => `🔥 ${t} - 이거 레전드 아님...?`,
      (t: string) => `😱 이거 진짜...? ${t} 대박`,
      // FOMO-driven - high urgency
      (t: string) => `💎 다들 이미 보고 있는 ${t} ㄷㄷ`,
      (t: string) => `👀 ${t}\n이거 놓치면 후회함`,
      // Direct recommendation - personal touch
      (t: string) => `🎨 ${t} - 완전 숨은 명작`,
    ],
    facebook: [
      // Longer format works on Facebook with line breaks for visual hierarchy
      `✨ ${title}\n\n진짜 대박이던데 왜 이제 알았을까 😭\n지금 바로 확인 👆`,
      `🔥 혹시 ${title} 아는 사람?\n완전 숨은 명작이던데... 👀`,
      `💎 ${title}\n\n이거 진심 레전드\n댓글로 얘기하자 💬`,
      `🎨 ${title} 발견!\n\n놓치지 마세요 ✨`,
    ],
    line: [
      // Very casual, friend-to-friend tone with Korean text speak
      `이거 ㄹㅇ 꿀잼ㅋㅋㅋ\n${title}\n같이 보자 💬`,
      `${title} 발견\n이거 완전 대박 🔥`,
      `헐 ${title}\n이거 봐봐 ㄷㄷ`,
      `${title}\n진심 레전드 👀`,
    ],
    telegram: [
      // Community-focused, group sharing optimized
      `💎 ${title}\n그룹에 공유하고 싶은 작품!`,
      `🔥 ${title}\n이거 완전 레전드`,
      `✨ ${title} - 숨은 명작 발견`,
      `🎨 ${title}\n다들 이거 봐야 함`,
    ],
    native: [
      // For native device sharing (iOS/Android share sheet)
      `🔥 ${title} - 이거 대박`,
      `✨ ${title} 추천!`,
      `💎 ${title} - 숨은 명작`,
    ],
  }

  if (platform === 'x') {
    const xTemplates = templates.x
    const selectedTemplate = xTemplates[Math.floor(Math.random() * xTemplates.length)]
    const templateOverhead = getTwitterCharCount(selectedTemplate(''))
    const X_CHAR_LIMIT = 280
    const EXTRA_SPACE = 10
    const currentUrl = window.location.href
    const availableForTitle = X_CHAR_LIMIT - templateOverhead - currentUrl.length - EXTRA_SPACE
    const truncatedTitle = truncateForTwitter(title, availableForTitle)
    return selectedTemplate(truncatedTitle)
  }

  const platformTemplates = templates[platform as keyof typeof templates] as string[]
  return platformTemplates[Math.floor(Math.random() * platformTemplates.length)]
}

/**
 * Calculate Twitter character count (unicode=2, alphabet=1)
 * Twitter counts characters differently: emojis and non-ASCII chars count as 2
 */
function getTwitterCharCount(text: string): number {
  let count = 0
  for (const char of text) {
    const code = char.charCodeAt(0)
    count += code >= 0x20 && code <= 0x7e ? 1 : 2
  }
  return count
}

/**
 * Truncate title to fit within Twitter's character limit
 * Twitter limit: 280 chars (unicode=2, alphabet=1)
 * URL takes ~23 chars (t.co shortlink)
 */
function truncateForTwitter(title: string, maxChars: number): string {
  const titleCharCount = getTwitterCharCount(title)

  if (titleCharCount <= maxChars) {
    return title
  }

  // Truncate and add ellipsis
  let i = 0
  let currentCount = 0
  const ellipsis = '...'
  const ellipsisCount = 3

  for (const char of title) {
    const charCount = char.charCodeAt(0) >= 0x20 && char.charCodeAt(0) <= 0x7e ? 1 : 2
    if (currentCount + charCount + ellipsisCount > maxChars) {
      break
    }
    i += 1
    currentCount += charCount
  }

  return title.slice(0, i) + ellipsis
}

const sharePlatforms: SharePlatform[] = [
  {
    name: 'X',
    icon: LogoX,
    color: 'bg-zinc-800',
    hoverColor: 'hover:bg-zinc-700',
    action: (url: string, sharingText: string) => {
      const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(sharingText)}`
      window.open(shareUrl, '_blank', 'width=550,height=420')
    },
  },
  {
    name: 'Facebook',
    icon: LogoFacebook,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-500',
    action: (url: string, sharingText: string) => {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(sharingText)}`
      window.open(shareUrl, '_blank', 'width=550,height=420')
    },
  },
  {
    name: 'Telegram',
    icon: LogoTelegram,
    color: 'bg-sky-500',
    hoverColor: 'hover:bg-sky-400',
    action: (url: string, sharingText: string) => {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(sharingText)}`
      window.open(shareUrl, '_blank', 'width=550,height=420')
    },
  },
  {
    name: 'LINE',
    icon: LogoLine,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-400',
    action: (url: string, _sharingText: string) => {
      // LINE doesn't support text parameter in share URL, but we keep the signature consistent
      const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`
      window.open(shareUrl, '_blank', 'width=550,height=420')
    },
  },
]
