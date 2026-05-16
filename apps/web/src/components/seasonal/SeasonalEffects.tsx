'use client'

import type { ComponentType } from 'react'

import ms from 'ms'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import { getActiveSeasonalEffectId, type SeasonalEffectId } from '@/components/seasonal/seasonalEffectConfig'

const EFFECT_CHECK_INTERVAL_MS = ms('10 minutes')
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const CherryBlossomEffect = dynamic(() => import('@/components/seasonal/CherryBlossomEffect'), { ssr: false })

const SEASONAL_EFFECT_COMPONENT_BY_ID = {
  'cherry-blossom': CherryBlossomEffect,
} satisfies Record<SeasonalEffectId, ComponentType>

export default function SeasonalEffects() {
  const [activeEffectId, setActiveEffectId] = useState<SeasonalEffectId | null>(null)

  useEffect(() => {
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY)

    function updateActiveEffect() {
      setActiveEffectId(motionQuery.matches ? null : getActiveSeasonalEffectId())
    }

    updateActiveEffect()

    const intervalId = window.setInterval(updateActiveEffect, EFFECT_CHECK_INTERVAL_MS)
    motionQuery.addEventListener('change', updateActiveEffect)

    return () => {
      window.clearInterval(intervalId)
      motionQuery.removeEventListener('change', updateActiveEffect)
    }
  }, [])

  if (!activeEffectId) {
    return null
  }

  const EffectComponent = SEASONAL_EFFECT_COMPONENT_BY_ID[activeEffectId]

  return <EffectComponent />
}
