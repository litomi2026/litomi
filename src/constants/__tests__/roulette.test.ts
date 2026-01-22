import { describe, expect, it } from 'bun:test'

import { assertRouletteConfig, getRouletteRoiInfo, ROULETTE_CONFIG } from '@/constants/roulette'

describe('roulette config', () => {
  it('should satisfy ROI < 1 and <= target', () => {
    expect(() => assertRouletteConfig(ROULETTE_CONFIG)).not.toThrow()
    const { expectedPayoutMultiplierX100 } = getRouletteRoiInfo(ROULETTE_CONFIG)
    expect(expectedPayoutMultiplierX100).toBeLessThan(100)
    expect(expectedPayoutMultiplierX100).toBeLessThanOrEqual(ROULETTE_CONFIG.targetRoiX100)
  })
})

