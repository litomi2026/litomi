export type RouletteConfig = {
  minBet: number
  maxBet: number
  /**
   * Expected payout multiplier x100.
   * Example: 90 => ROI 0.90 (player EV is -10% of bet).
   */
  targetRoiX100: number
  maxPayoutMultiplierX100: number
  segments: RouletteSegment[]
}

export type RouletteSegment = {
  id: 'boost' | 'double' | 'jackpot' | 'lose'
  label: string
  /**
   * Relative probability weight.
   * Higher = more likely.
   */
  weight: number
  /**
   * Payout multiplier x100, including the bet.
   * - 0     => lose (payout 0)
   * - 125   => 1.25x payout
   * - 200   => 2x payout
   * - 10000 => 100x payout
   */
  payoutMultiplierX100: number
}

/**
 * Design goals:
 * - ROI < 1 (player expected value < break-even)
 * - Big "jackpot" exists to spike dopamine
 *
 * ROI is controlled by the weighted average of payout multipliers:
 *   expectedMultiplierX100 = sum(weight * payoutMultiplierX100) / sum(weight)
 */
export const ROULETTE_CONFIG: RouletteConfig = {
  minBet: 10,
  maxBet: 10_000,
  targetRoiX100: 90,
  maxPayoutMultiplierX100: 10_000,
  segments: [
    { id: 'jackpot', label: '잭팟', weight: 10, payoutMultiplierX100: 10_000 },
    { id: 'double', label: '더블', weight: 2_500, payoutMultiplierX100: 200 },
    { id: 'boost', label: '부스트', weight: 2_400, payoutMultiplierX100: 125 },
    { id: 'lose', label: '꽝', weight: 5_090, payoutMultiplierX100: 0 },
  ],
}

export type RouletteRoiInfo = {
  totalWeight: number
  expectedPayoutMultiplierX100: number
}

export function assertRouletteConfig(config: RouletteConfig): void {
  const ids = new Set<string>()
  for (const s of config.segments) {
    if (ids.has(s.id)) {
      throw new Error(`Duplicate roulette segment id: ${s.id}`)
    }
    ids.add(s.id)
    if (!Number.isFinite(s.weight) || s.weight <= 0) {
      throw new Error(`Invalid roulette segment weight: ${s.id}`)
    }
    if (!Number.isFinite(s.payoutMultiplierX100) || s.payoutMultiplierX100 < 0) {
      throw new Error(`Invalid roulette payout multiplier: ${s.id}`)
    }
    if (s.payoutMultiplierX100 > config.maxPayoutMultiplierX100) {
      throw new Error(`Roulette payout multiplier exceeds max: ${s.id}`)
    }
  }

  if (!Number.isFinite(config.minBet) || config.minBet <= 0) {
    throw new Error('Invalid roulette minBet')
  }
  if (!Number.isFinite(config.maxBet) || config.maxBet < config.minBet) {
    throw new Error('Invalid roulette maxBet')
  }
  if (!Number.isFinite(config.targetRoiX100) || config.targetRoiX100 <= 0 || config.targetRoiX100 >= 100) {
    throw new Error('Invalid roulette targetRoiX100 (must be 1..99)')
  }

  const { expectedPayoutMultiplierX100 } = getRouletteRoiInfo(config)
  if (expectedPayoutMultiplierX100 >= 100) {
    throw new Error(`Roulette ROI must be < 1.0, got ${expectedPayoutMultiplierX100 / 100}`)
  }
  if (expectedPayoutMultiplierX100 > config.targetRoiX100) {
    throw new Error(
      `Roulette ROI must be <= target (${config.targetRoiX100 / 100}), got ${expectedPayoutMultiplierX100 / 100}`,
    )
  }
}

export function getRouletteRoiInfo(config: RouletteConfig): RouletteRoiInfo {
  const totalWeight = config.segments.reduce((acc, s) => acc + s.weight, 0)
  if (totalWeight <= 0) {
    return { totalWeight: 0, expectedPayoutMultiplierX100: 0 }
  }

  const numerator = config.segments.reduce((acc, s) => acc + s.weight * s.payoutMultiplierX100, 0)
  const expectedPayoutMultiplierX100 = Math.floor(numerator / totalWeight)
  return { totalWeight, expectedPayoutMultiplierX100 }
}
