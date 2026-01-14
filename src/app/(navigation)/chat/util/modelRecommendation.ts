export type DeviceInfo = {
  deviceMemoryGb: number | null
  isMobile: boolean
}

export function estimateVramBudgetGb(info: DeviceInfo): number {
  if (info.deviceMemoryGb === null) {
    return info.isMobile ? 1.4 : 5.1
  }
  return Math.max(1.4, info.deviceMemoryGb)
}

export function getDeviceInfoFromNavigator(): DeviceInfo {
  if (typeof navigator === 'undefined') {
    return { deviceMemoryGb: null, isMobile: false }
  }

  const deviceMemoryGb = getDeviceMemoryGb()
  const isMobile = isProbablyMobile()

  return { deviceMemoryGb, isMobile }
}

export function pickLargestWithinBudget<T extends { requiredVramGb: number }>(
  presets: readonly T[],
  budgetGb: number,
): T | null {
  let best: T | null = null
  for (const preset of presets) {
    if (preset.requiredVramGb > budgetGb) continue
    if (!best || preset.requiredVramGb > best.requiredVramGb) {
      best = preset
    }
  }
  return best
}

export function recommendModelIdFromNavigator<T extends { modelId: string; requiredVramGb: number }>(
  presets: readonly T[],
): string {
  // NOTE:
  // WebGPU does not expose real VRAM size for privacy reasons, so this is a heuristic.
  // We pick the largest preset that should fit within the estimated budget.
  const info = getDeviceInfoFromNavigator()
  const budgetGb = estimateVramBudgetGb(info)
  const best = pickLargestWithinBudget(presets, budgetGb)
  return (best ?? presets[0]).modelId
}

function getDeviceMemoryGb(): number | null {
  const raw = (navigator as { deviceMemory?: unknown }).deviceMemory
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) {
    return null
  }
  return raw
}

function isProbablyMobile(): boolean {
  const uad = (navigator as { userAgentData?: unknown }).userAgentData
  if (uad && typeof uad === 'object' && 'mobile' in uad) {
    const mobile = (uad as { mobile?: unknown }).mobile
    if (typeof mobile === 'boolean') return mobile
  }

  const ua = navigator.userAgent
  return /Android|iPhone|iPad|iPod/i.test(ua)
}
