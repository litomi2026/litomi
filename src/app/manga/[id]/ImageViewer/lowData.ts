import { LowDataPreference } from './store/lowDataMode'

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

export function resolveLowDataState(
  preference: LowDataPreference,
  snapshot: LowDataSnapshot | null,
): ResolvedLowDataState {
  if (!snapshot) {
    return { enabled: false, reason: 'none' }
  }

  if (preference === 'off') {
    return { enabled: false, reason: 'none' }
  }

  if (preference === 'on') {
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
