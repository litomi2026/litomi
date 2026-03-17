import type { AdSlotDefinition, JuicyAdsLayoutNode } from './types'

import { AD_SLOTS } from './constants'

function group(className: string, children: readonly JuicyAdsLayoutNode[]): JuicyAdsLayoutNode {
  return { type: 'group', className, children }
}

function slot(slot: AdSlotDefinition, className?: string): JuicyAdsLayoutNode {
  return { type: 'slot', slot, className }
}

export const DEFAULT_NON_ADULT_AD_LAYOUT = [
  slot(AD_SLOTS.BANNER_308X286),
  slot(AD_SLOTS.BANNER_300X100, 'md:hidden'),
  slot(AD_SLOTS.BANNER_308X286_2, 'hidden md:flex'),
  slot(AD_SLOTS.BANNER_300X250, 'hidden lg:flex'),
  group('hidden 2xl:flex flex-col gap-0.5', [
    slot(AD_SLOTS.BANNER_300X100),
    slot(AD_SLOTS.BANNER_300X100_2),
    slot(AD_SLOTS.BANNER_300X100_3),
  ]),
]

export const LIBRARY_NON_ADULT_AD_LAYOUT = [
  slot(AD_SLOTS.BANNER_308X286),
  slot(AD_SLOTS.BANNER_300X100, 'md:hidden'),
  slot(AD_SLOTS.BANNER_308X286_2, 'hidden md:flex'),
  slot(AD_SLOTS.BANNER_300X250, 'hidden lg:flex'),
]

export const VIEWER_UNLOCK_NON_ADULT_AD_LAYOUT = [slot(AD_SLOTS.BANNER_308X286)]
