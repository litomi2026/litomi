import { AD_SLOTS } from './constants'
import type { AdSlotDefinition, JuicyAdsLayoutNode } from './types'

function group(className: string, children: readonly JuicyAdsLayoutNode[]): JuicyAdsLayoutNode {
  return { type: 'group', className, children }
}

function slot(slot: AdSlotDefinition, className?: string): JuicyAdsLayoutNode {
  return { type: 'slot', slot, className }
}

export const DEFAULT_AD_LAYOUT = [
  slot(AD_SLOTS.BANNER_308X286),
  slot(AD_SLOTS.BANNER_300X100, 'min-[720px]:hidden'),
  slot(AD_SLOTS.BANNER_308X286_2, 'hidden min-[720px]:flex'),
  slot(AD_SLOTS.BANNER_300X250, 'hidden lg:flex'),
  group('hidden min-[1350px]:flex flex-col gap-0.5', [
    slot(AD_SLOTS.BANNER_300X100),
    slot(AD_SLOTS.BANNER_300X100_2),
    slot(AD_SLOTS.BANNER_300X100_3),
  ]),
]

export const LIBRARY_AD_LAYOUT = [
  slot(AD_SLOTS.BANNER_308X286),
  slot(AD_SLOTS.BANNER_300X100, 'min-[800px]:hidden'),
  slot(AD_SLOTS.BANNER_308X286_2, 'hidden min-[800px]:flex'),
  slot(AD_SLOTS.BANNER_300X250, 'hidden xl:flex'),
]

export const SINGLE_AD_LAYOUT = [slot(AD_SLOTS.BANNER_308X286)]
