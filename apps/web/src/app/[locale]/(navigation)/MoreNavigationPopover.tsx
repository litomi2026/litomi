'use client'

import { Bot, Clover, HeartHandshake, type LucideIcon, MoreHorizontal, ScanEye } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import OverlayHost from '@/components/ui/OverlayHost'
import { usePathname } from '@/i18n/navigation'

import SelectableLink from './SelectableLink'

type NavigationItem = {
  href: string
  labelKey: string
  Icon: LucideIcon
  selectedIconStyle: SelectedIconStyle
}

type PopoverPosition = {
  bottom: number
  left: number
}

type Props = {
  className?: string
}

type SelectedIconStyle = 'fill-soft' | 'fill' | 'stroke'

const MORE_NAVIGATION_ITEMS = [
  {
    href: '/censor',
    labelKey: 'censor',
    Icon: ScanEye,
    selectedIconStyle: 'stroke',
  },
  {
    href: '/donation',
    labelKey: 'donation',
    Icon: HeartHandshake,
    selectedIconStyle: 'stroke',
  },
  {
    href: '/chat',
    labelKey: 'chat',
    Icon: Bot,
    selectedIconStyle: 'stroke',
  },
  {
    href: '/fortune',
    labelKey: 'fortune',
    Icon: Clover,
    selectedIconStyle: 'stroke',
  },
] satisfies NavigationItem[]

const POPOVER_GAP = 8
const POPOVER_LEFT_OFFSET = 6

export default function MoreNavigationPopover({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<PopoverPosition>({ bottom: 0, left: 0 })
  const popoverRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverId = useId()
  const pathname = usePathname()
  const t = useTranslations('Navigation.sidebar')
  const hasActiveItem = MORE_NAVIGATION_ITEMS.some((item) => pathname === item.href)

  useLayoutEffect(() => {
    if (!isOpen) {
      return
    }

    function updatePosition() {
      const trigger = triggerRef.current

      if (!trigger) {
        return
      }

      const triggerRect = trigger.getBoundingClientRect()
      const anchorRect = rootRef.current?.getBoundingClientRect() ?? triggerRect
      const left = anchorRect.left + POPOVER_LEFT_OFFSET
      const bottom = window.innerHeight - triggerRect.top + POPOVER_GAP

      setPosition({ bottom, left })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const scrollContainer = rootRef.current?.closest('nav')

    function closeOnOutsideClick(event: PointerEvent) {
      const target = event.target as Node

      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    function closeOnScroll() {
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    scrollContainer?.addEventListener('scroll', closeOnScroll, { passive: true })

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
      scrollContainer?.removeEventListener('scroll', closeOnScroll)
    }
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <div className={twMerge('relative', className)} ref={rootRef}>
      <button
        aria-controls={isOpen ? popoverId : undefined}
        aria-expanded={isOpen}
        aria-label={t('more')}
        className={twMerge(
          'callout-none group flex w-full p-1 sm:block sm:p-0',
          'text-zinc-400 hover:text-foreground data-[active=true]:font-bold data-[active=true]:text-foreground',
        )}
        data-active={hasActiveItem || undefined}
        onClick={() => setIsOpen((value) => !value)}
        ref={triggerRef}
        title={t('more')}
        type="button"
      >
        <div
          className={twMerge(
            'flex items-center gap-5 w-fit mx-auto p-3 rounded-full transition 2xl:m-0 relative',
            'group-active:scale-90 group-active:md:scale-95',
          )}
        >
          <MoreHorizontal
            aria-hidden
            className={twMerge('size-6 shrink-0 text-foreground', hasActiveItem && 'stroke-3')}
          />
          <span className="hidden min-w-0 2xl:block">{t('more')}</span>
        </div>
      </button>
      {isOpen && (
        <OverlayHost>
          <div
            className={twMerge(
              'pointer-events-auto fixed z-60 grid gap-1 rounded-2xl border-2 border-zinc-800 bg-zinc-900 p-2 shadow-xl shadow-black/30 transition',
              'max-h-80 overflow-y-auto',
            )}
            id={popoverId}
            ref={popoverRef}
            style={position}
          >
            {MORE_NAVIGATION_ITEMS.map(({ href, labelKey, Icon, selectedIconStyle }) => (
              <SelectableLink href={href} icon={<Icon />} key={href} selectedIconStyle={selectedIconStyle}>
                {t(labelKey)}
              </SelectableLink>
            ))}
          </div>
        </OverlayHost>
      )}
    </div>
  )
}
