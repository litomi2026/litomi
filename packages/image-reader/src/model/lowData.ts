import type { LowDataMode } from '#reader/state/readerStore'

export type LowDataReason = 'auto-save-data' | 'auto-slow-network' | 'manual-on' | 'none'

export type LowDataSnapshot = {
  saveData: boolean
  effectiveType?: string
}

export type ResolvedLowDataState = {
  enabled: boolean
  reason: LowDataReason
}

type NetworkInformationLike = {
  effectiveType?: string
  saveData?: boolean
}

const SLOW_EFFECTIVE_TYPES = new Set(['2g', 'slow-2g'])

export function getAutoLowDataNoticeMessage(reason: LowDataReason): string | null {
  if (reason === 'auto-save-data') {
    return '데이터 절약 모드가 켜졌어요'
  }

  if (reason === 'auto-slow-network') {
    return '느린 네트워크가 감지됐어요'
  }

  return null
}

export function getLowDataLabel(lowData: LowDataMode): string {
  if (lowData === 'off') {
    return '저데이터 꺼짐'
  }

  if (lowData === 'on') {
    return '저데이터 켜짐'
  }

  return '저데이터 자동'
}

export function getNavigatorLowDataSnapshot(): LowDataSnapshot {
  if (typeof navigator === 'undefined') {
    return {
      saveData: false,
      effectiveType: undefined,
    }
  }

  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection

  return {
    saveData: Boolean(connection?.saveData),
    effectiveType: connection?.effectiveType,
  }
}

export function resolveLowDataState(lowData: LowDataMode, snapshot: LowDataSnapshot | null): ResolvedLowDataState {
  if (!snapshot) {
    return { enabled: false, reason: 'none' }
  }

  if (lowData === 'off') {
    return { enabled: false, reason: 'none' }
  }

  if (lowData === 'on') {
    return { enabled: true, reason: 'manual-on' }
  }

  if (snapshot.saveData) {
    return { enabled: true, reason: 'auto-save-data' }
  }

  if (snapshot.effectiveType && SLOW_EFFECTIVE_TYPES.has(snapshot.effectiveType)) {
    return { enabled: true, reason: 'auto-slow-network' }
  }

  return { enabled: false, reason: 'none' }
}
