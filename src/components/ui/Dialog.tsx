'use client'

import {
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { twMerge } from 'tailwind-merge'

import { registerTopLayerPortalContainer, unregisterTopLayerPortalContainer } from '@/components/ui/topLayerPortal'

type DialogState = 'closed' | 'closing' | 'open' | 'opening'

type Props = {
  open: boolean
  onClose: () => void
  onAfterClose?: () => void
  children: ReactNode
  className?: string
  style?: CSSProperties
  ariaLabel: string
}

export default function Dialog({ open, onClose, onAfterClose, children, className = '', style, ariaLabel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const transitionEndHandledRef = useRef(false)
  const hasEnteredOpenStateRef = useRef(false)
  const lastActiveElementRef = useRef<HTMLElement | null>(null)
  const bodyStyleRestoreRef = useRef<{ overflow: string; touchAction: string } | null>(null)
  const hasRegisteredPortalContainerRef = useRef(false)
  const [state, setState] = useState<DialogState>('closed')

  const requestClose = useCallback(() => {
    if (state === 'closing' || state === 'closed') {
      return
    }

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    setState('closing')
    onClose()
  }, [onClose, state])

  function handleClick(e: MouseEvent) {
    e.stopPropagation()
    if (e.target === e.currentTarget) {
      requestClose()
    }
  }

  // NOTE: `open` 변경에 따라 dialog를 열고/닫아요
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    transitionEndHandledRef.current = false

    if (open) {
      hasEnteredOpenStateRef.current = false
      lastActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

      if (!dialog.open) {
        dialog.showModal()
      }

      if (!hasRegisteredPortalContainerRef.current) {
        registerTopLayerPortalContainer(dialog)
        hasRegisteredPortalContainerRef.current = true
      }

      setState('opening')

      rafRef.current = window.requestAnimationFrame(() => {
        hasEnteredOpenStateRef.current = true
        setState('open')
      })

      return
    }

    if (!dialog.open) {
      if (hasRegisteredPortalContainerRef.current) {
        unregisterTopLayerPortalContainer(dialog)
        hasRegisteredPortalContainerRef.current = false
      }
      setState('closed')
      return
    }

    setState('closing')
  }, [open])

  // NOTE: dialog가 보이는 동안(닫힘 애니메이션 포함) 페이지 스크롤을 잠가요
  useEffect(() => {
    if (state === 'closed') {
      if (bodyStyleRestoreRef.current) {
        const { overflow, touchAction } = bodyStyleRestoreRef.current
        document.body.style.overflow = overflow
        document.body.style.touchAction = touchAction
        bodyStyleRestoreRef.current = null
      }
      return
    }

    if (!bodyStyleRestoreRef.current) {
      bodyStyleRestoreRef.current = {
        overflow: document.body.style.overflow,
        touchAction: document.body.style.touchAction,
      }
    }

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      if (bodyStyleRestoreRef.current) {
        const { overflow, touchAction } = bodyStyleRestoreRef.current
        document.body.style.overflow = overflow
        document.body.style.touchAction = touchAction
        bodyStyleRestoreRef.current = null
      }
    }
  }, [onAfterClose, state])

  // NOTE: ESC로 닫힐 때 기본 close를 막고, 닫힘 트랜지션이 돌게 해요
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    function handleCancel(event: Event) {
      event.preventDefault()
      requestClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [requestClose])

  // NOTE: 닫힘 애니메이션이 끝난 뒤 `dialog.close()`로 top-layer에서 실제로 제거해요
  useEffect(() => {
    const dialog = dialogRef.current
    const panel = panelRef.current

    if (!dialog || !panel || state !== 'closing') {
      return
    }

    function finalizeClose(dialogEl: HTMLDialogElement | null) {
      if (dialogEl?.open) {
        dialogEl.close()
      }

      const portalContainer = dialogEl ?? dialogRef.current
      if (hasRegisteredPortalContainerRef.current && portalContainer) {
        unregisterTopLayerPortalContainer(portalContainer)
        hasRegisteredPortalContainerRef.current = false
      }

      setState('closed')

      const lastActive = lastActiveElementRef.current
      lastActiveElementRef.current = null
      if (lastActive?.isConnected) {
        lastActive.focus()
      }

      onAfterClose?.()
    }

    if (!hasEnteredOpenStateRef.current) {
      finalizeClose(dialog)
      return
    }

    function handleTransitionEnd(event: TransitionEvent) {
      if (transitionEndHandledRef.current) {
        return
      }

      if (event.target !== panel || (event.propertyName !== 'opacity' && event.propertyName !== 'transform')) {
        return
      }

      transitionEndHandledRef.current = true

      finalizeClose(dialogRef.current)
    }

    panel.addEventListener('transitionend', handleTransitionEnd)
    return () => panel.removeEventListener('transitionend', handleTransitionEnd)
  }, [onAfterClose, state])

  // NOTE: 언마운트 시 requestAnimationFrame과 top-layer 컨테이너 등록을 정리해요
  useEffect(() => {
    const dialog = dialogRef.current

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      if (hasRegisteredPortalContainerRef.current && dialog) {
        unregisterTopLayerPortalContainer(dialog)
        hasRegisteredPortalContainerRef.current = false
      }
    }
  }, [])

  return (
    <dialog
      aria-label={ariaLabel}
      className="fixed inset-0 m-0 h-dvh w-dvw max-h-none max-w-none p-0 border-0 bg-transparent text-foreground outline-none group flex items-center justify-center 
        data-[state=closed]:hidden backdrop:bg-background/80 backdrop:transition backdrop:opacity-0 data-[state=open]:backdrop:opacity-100"
      data-state={state}
      onClick={handleClick}
      ref={dialogRef}
    >
      <div
        className={twMerge(
          'flex w-dvw h-dvh flex-col overflow-hidden bg-zinc-900 transition scale-98 opacity-0 group-data-[state=open]:scale-100 group-data-[state=open]:opacity-100 max-sm:pb-safe sm:max-w-prose sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:w-full sm:rounded-xl sm:border-2 sm:border-zinc-800',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        ref={panelRef}
        style={style}
      >
        {children}
      </div>
    </dialog>
  )
}
