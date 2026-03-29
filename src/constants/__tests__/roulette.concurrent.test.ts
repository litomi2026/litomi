import { describe, expect, it } from 'bun:test'

import { assertRouletteConfig, getRouletteRoiInfo, ROULETTE_CONFIG } from '@/constants/roulette'

describe('룰렛 설정', () => {
  it('ROI가 1보다 작고 목표값 이하인지 만족한다', () => {
    expect(() => assertRouletteConfig(ROULETTE_CONFIG)).not.toThrow()
    const { expectedPayoutMultiplierX100 } = getRouletteRoiInfo(ROULETTE_CONFIG)
    expect(expectedPayoutMultiplierX100).toBeLessThan(100)
    expect(expectedPayoutMultiplierX100).toBeLessThanOrEqual(ROULETTE_CONFIG.targetRoiX100)
  })
})
