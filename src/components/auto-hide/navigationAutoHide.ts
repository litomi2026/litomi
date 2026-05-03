'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

import { SCROLL_THRESHOLD_PX } from '@/constants/policy'

type NavigationAutoHideListener = () => void

type ScrollRegistration = {
  element: HTMLElement
  id: symbol
}

type ScrollTarget = HTMLElement | Window

class NavigationAutoHideController {
  private activeScrollTarget: ScrollTarget | null = null
  private animationFrameId: number | null = null
  private isNavigationHidden = false
  private lastScrollY = 0
  private readonly listeners = new Set<NavigationAutoHideListener>()
  private readonly scrollRegistrations: ScrollRegistration[] = []

  getServerSnapshot = () => false

  getSnapshot = () => this.isNavigationHidden

  registerScrollElement = (element: HTMLElement) => {
    const registration: ScrollRegistration = {
      element,
      id: Symbol('navigation-auto-hide-scroll-element'),
    }

    this.scrollRegistrations.push(registration)
    this.syncScrollListener()

    return () => {
      const index = this.scrollRegistrations.findIndex(({ id }) => id === registration.id)

      if (index < 0) {
        return
      }

      this.scrollRegistrations.splice(index, 1)
      this.syncScrollListener()
    }
  }

  reveal = () => {
    this.setNavigationHidden(false)
  }

  subscribe = (listener: NavigationAutoHideListener) => {
    this.listeners.add(listener)
    this.syncScrollListener()

    return () => {
      this.listeners.delete(listener)

      if (this.listeners.size === 0) {
        this.detachScrollListener()
      }
    }
  }

  private cancelScheduledScrollUpdate() {
    if (this.animationFrameId === null || typeof window === 'undefined') {
      return
    }

    window.cancelAnimationFrame(this.animationFrameId)
    this.animationFrameId = null
  }

  private detachScrollListener() {
    this.cancelScheduledScrollUpdate()
    this.activeScrollTarget?.removeEventListener('scroll', this.handleScroll)
    this.activeScrollTarget = null
  }

  private getActiveScrollTarget(): ScrollTarget | null {
    return this.scrollRegistrations.at(-1)?.element ?? getBrowserWindow()
  }

  private handleScroll = () => {
    if (this.animationFrameId !== null || typeof window === 'undefined') {
      return
    }

    this.animationFrameId = window.requestAnimationFrame(this.updateFromScroll)
  }

  private notify() {
    for (const listener of this.listeners) {
      listener()
    }
  }

  private resetScrollState(scrollTarget: ScrollTarget) {
    this.lastScrollY = getScrollY(scrollTarget)
    this.setNavigationHidden(false)
  }

  private setNavigationHidden(nextIsNavigationHidden: boolean) {
    if (this.isNavigationHidden === nextIsNavigationHidden) {
      return
    }

    this.isNavigationHidden = nextIsNavigationHidden
    this.notify()
  }

  private syncScrollListener() {
    if (this.listeners.size === 0) {
      return
    }

    const activeScrollTarget = this.getActiveScrollTarget()

    if (!activeScrollTarget || this.activeScrollTarget === activeScrollTarget) {
      return
    }

    this.detachScrollListener()
    this.activeScrollTarget = activeScrollTarget
    this.resetScrollState(activeScrollTarget)
    activeScrollTarget.addEventListener('scroll', this.handleScroll, { passive: true })
  }

  private updateFromScroll = () => {
    this.animationFrameId = null

    if (!this.activeScrollTarget) {
      return
    }

    const currentScrollY = getScrollY(this.activeScrollTarget)

    if (currentScrollY > SCROLL_THRESHOLD_PX && currentScrollY > this.lastScrollY) {
      this.setNavigationHidden(true)
    } else if (currentScrollY < this.lastScrollY) {
      this.setNavigationHidden(false)
    }

    this.lastScrollY = currentScrollY
  }
}

const navigationAutoHideController = new NavigationAutoHideController()

export function revealNavigationAutoHide() {
  navigationAutoHideController.reveal()
}

export function useNavigationAutoHideScrollElement() {
  const registeredElementRef = useRef<HTMLElement | null>(null)
  const unregisterRef = useRef<(() => void) | null>(null)

  function setScrollElement(element: HTMLElement | null) {
    if (registeredElementRef.current === element) {
      return
    }

    unregisterRef.current?.()
    registeredElementRef.current = element
    unregisterRef.current = element ? navigationAutoHideController.registerScrollElement(element) : null
  }

  useEffect(
    () => () => {
      unregisterRef.current?.()
      unregisterRef.current = null
      registeredElementRef.current = null
    },
    [],
  )

  return setScrollElement
}

export function useNavigationAutoHideState() {
  return useSyncExternalStore(
    navigationAutoHideController.subscribe,
    navigationAutoHideController.getSnapshot,
    navigationAutoHideController.getServerSnapshot,
  )
}

function getBrowserWindow() {
  return typeof window === 'undefined' ? null : window
}

function getScrollY(scrollTarget: ScrollTarget) {
  const browserWindow = getBrowserWindow()

  return scrollTarget === browserWindow ? browserWindow.scrollY : scrollTarget.scrollTop
}
