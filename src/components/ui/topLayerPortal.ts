'use client'

import { useSyncExternalStore } from 'react'

type Listener = () => void

const stack: HTMLElement[] = []
const listeners = new Set<Listener>()

export function getTopLayerPortalContainer(): HTMLElement | null {
  return stack.length > 0 ? stack[stack.length - 1] : null
}

/**
 * Native <dialog> 는 "top layer" 에 올라가기 때문에,
 * 다이얼로그가 열려있을 때는 overlay(드롭다운 등)를 다이얼로그 내부로 portal 해야 보여요.
 *
 * 이 store는 현재 top-layer 컨테이너(가장 위에 열린 dialog)를 추적해요.
 */
export function registerTopLayerPortalContainer(el: HTMLElement) {
  stack.push(el)
  emit()
}

export function subscribeTopLayerPortalContainer(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function unregisterTopLayerPortalContainer(el: HTMLElement) {
  const idx = stack.lastIndexOf(el)
  if (idx === -1) {
    return
  }

  stack.splice(idx, 1)
  emit()
}

export function useTopLayerPortalContainer(): HTMLElement | null {
  return useSyncExternalStore(subscribeTopLayerPortalContainer, getTopLayerPortalContainer)
}

function emit() {
  for (const listener of listeners) {
    listener()
  }
}
