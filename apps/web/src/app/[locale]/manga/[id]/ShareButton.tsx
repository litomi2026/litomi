'use client'

import type { Manga } from '@litomi/domain/manga/model'

import { Dialog, DialogBody, DialogHeader } from '@litomi/ui'
import { Check, Link, Share2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ComponentProps, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import LogoFacebook from '@/components/icons/LogoFacebook'
import LogoLine from '@/components/icons/LogoLine'
import LogoTelegram from '@/components/icons/LogoTelegram'
import LogoX from '@/components/icons/LogoX'

type CopyStatus = 'error' | 'idle' | 'success'

const X_CHAR_LIMIT = 280
const X_EXTRA_SPACE = 10

interface Props extends ComponentProps<'button'> {
  manga: Manga
}
type SharePlatform = {
  id: SharePlatformId
  name: string
  icon: React.ComponentType<ComponentProps<'svg'>>
  color: string
  hoverColor: string
  action: (url: string, sharingText: string) => void
}

type SharePlatformId = Exclude<ShareTarget, 'native'>

type ShareTarget = 'facebook' | 'line' | 'native' | 'telegram' | 'x'

export default function ShareButton({ manga, className, ...props }: Props) {
  const [supportsNativeShare, setSupportsNativeShare] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const [isOpened, setIsOpened] = useState(false)
  const t = useTranslations('MangaViewer.share')

  function getSharingText(platform: ShareTarget): string {
    const templatePath = getRandomShareTemplatePath(platform, t.raw(`templates.${platform}`))

    if (platform !== 'x') {
      return t(templatePath, { title: manga.title })
    }

    const templateOverhead = getTwitterCharCount(t(templatePath, { title: '' }))
    const availableForTitle = X_CHAR_LIMIT - templateOverhead - window.location.href.length - X_EXTRA_SPACE
    return t(templatePath, { title: truncateForTwitter(manga.title, availableForTitle) })
  }

  async function handleNativeShare() {
    try {
      const sharingText = getSharingText('native')

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
        title={t('action')}
        {...props}
      >
        <Share2 className="size-6" />
        <span className="text-sm font-semibold hidden lg:inline">{t('action')}</span>
      </button>
      <Dialog ariaLabel={t('action')} onClose={() => setIsOpened(false)} open={isOpened}>
        <DialogHeader onClose={() => setIsOpened(false)} title={t('action')} />
        <DialogBody className="flex flex-col gap-4 sm:p-6">
          {supportsNativeShare && (
            <>
              <button
                aria-label={t('nativeShare')}
                className="flex justify-center items-center gap-2 text-sm font-semibold rounded-xl p-3 w-full transition bg-zinc-800 hover:bg-zinc-700 active:scale-98"
                onClick={handleNativeShare}
                type="button"
              >
                <Share2 className="size-5" />
                {t('nativeShare')}
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-zinc-700" />
                <span className="text-xs text-zinc-500">{t('or')}</span>
                <div className="flex-1 border-t border-zinc-700" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {sharePlatforms.map((platform) => {
              const Icon = platform.icon
              return (
                <button
                  aria-label={t('shareTo', { platform: platform.name })}
                  className={`flex flex-col items-center justify-center gap-2 p-2 sm:p-4 rounded-xl ${platform.color} ${platform.hoverColor} transition active:scale-95 touch-manipulation`}
                  key={platform.id}
                  onClick={() => {
                    const sharingText = getSharingText(platform.id)
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
                  {t('copySuccess')}
                </p>
              ) : copyStatus === 'error' ? (
                <p className="inline-flex items-center justify-center gap-1.5 text-red-400 font-medium">
                  <X aria-hidden className="size-4 shrink-0" />
                  {t('copyError')}
                </p>
              ) : (
                <p className="text-zinc-500">{t('copyStatusIdle')}</p>
              )}
            </div>
            <button
              aria-label={t('copyAction')}
              className="flex justify-center items-center gap-2 text-sm font-semibold rounded-xl p-3 w-full transition border-2 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 active:scale-95 touch-manipulation"
              onClick={handleCopy}
              type="button"
            >
              <Link className="size-5" />
              {t('copyAction')}
            </button>
          </div>
        </DialogBody>
      </Dialog>
    </>
  )
}

function getRandomShareTemplatePath(platform: ShareTarget, templates: Record<string, string>) {
  const keys = Object.keys(templates)
  const key = keys[Math.floor(Math.random() * keys.length)]
  return `templates.${platform}.${key}`
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
 * The caller passes the remaining title budget after template and URL overhead.
 */
function truncateForTwitter(title: string, maxChars: number): string {
  if (maxChars <= 0) {
    return ''
  }

  const titleCharCount = getTwitterCharCount(title)

  if (titleCharCount <= maxChars) {
    return title
  }

  // Truncate and add ellipsis
  let endIndex = 0
  let currentCount = 0
  const ellipsis = '...'
  const ellipsisCount = 3

  if (maxChars <= ellipsisCount) {
    return ''
  }

  for (const char of title) {
    const charCount = char.charCodeAt(0) >= 0x20 && char.charCodeAt(0) <= 0x7e ? 1 : 2
    if (currentCount + charCount + ellipsisCount > maxChars) {
      break
    }
    endIndex += char.length
    currentCount += charCount
  }

  return title.slice(0, endIndex) + ellipsis
}

const sharePlatforms: SharePlatform[] = [
  {
    id: 'x',
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
    id: 'facebook',
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
    id: 'telegram',
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
    id: 'line',
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
