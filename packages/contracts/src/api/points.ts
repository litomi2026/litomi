import { Locale } from '@litomi/domain/locale'
import { ROULETTE_CONFIG, type ROULETTE_SEGMENT_IDS } from '@litomi/domain/points/roulette'
import { z } from 'zod'

import { turnstileTokenSchema } from '../shared'

export interface GETV1PointsResponse {
  balance: number
  totalEarned: number
  totalSpent: number
}

export interface GETV1PointsDonationsMeRecipient {
  type: 'artist' | 'group'
  value: string
  label: string
  amount: number
}

export interface GETV1PointsDonationsMeItem {
  id: number
  totalAmount: number
  createdAt: string
  recipients: GETV1PointsDonationsMeRecipient[]
}

export interface GETV1PointsDonationsMeResponse {
  items: GETV1PointsDonationsMeItem[]
  nextCursor: number | null
}

export const postV1PointsDonationCreateRequestSchema = z.object({
  totalAmount: z.coerce.number().int().positive(),
  recipients: z
    .array(
      z.object({
        type: z.enum(['artist', 'group']),
        value: z.string().trim().min(1).max(200),
      }),
    )
    .min(1)
    .max(20),
})

export type POSTV1PointsDonationCreateRequest = z.infer<typeof postV1PointsDonationCreateRequestSchema>

export interface POSTV1PointsDonationCreateResponse {
  balance: number
  donationId: number
  totalAmount: number
  recipients: { type: 'artist' | 'group'; value: string; amount: number }[]
}

export const getV1PointsDonationRecipientQuerySchema = z.object({
  type: z.enum(['artist', 'group']),
  value: z.string().min(1),
})

export interface GETV1PointsDonationRecipientResponse {
  totalReceived: number
}

export const getV1PointsDonationsMeQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  locale: z.enum(Locale),
})

export const postV1PointEarnRequestSchema = z.object({
  token: z.string().length(64),
})

export interface POSTV1PointEarnResponse {
  balance: number
  earned: number
  dailyRemaining: number
}

export interface ExpansionInfo {
  base: number
  extra: number
  current: number
  max: number
  canExpand: boolean
  price: number
  unit: number
}

export interface GETV1PointExpansionResponse {
  library: ExpansionInfo
  history: ExpansionInfo
  rating: ExpansionInfo
  bookmark: ExpansionInfo
  pinnedLibrary: ExpansionInfo
}

export const postV1RouletteSpinRequestSchema = z.object({
  bet: z.coerce.number().int().min(ROULETTE_CONFIG.minBet).max(ROULETTE_CONFIG.maxBet).positive(),
})

export type POSTV1RouletteSpinRequest = z.infer<typeof postV1RouletteSpinRequestSchema>

export interface POSTV1RouletteSpinResponse {
  balance: number
  bet: number
  payout: number
  net: number
  landed: {
    id: (typeof ROULETTE_SEGMENT_IDS)[number]
    label: string
    payoutMultiplierX100: number
  }
}

export const postV1PointSpendRequestSchema = z.object({
  type: z.enum(['library', 'history', 'pinned_library', 'rating', 'bookmark', 'badge', 'theme']),
  itemId: z.string().optional(),
})

export type POSTV1PointSpendRequest = z.infer<typeof postV1PointSpendRequestSchema>

export interface POSTV1PointSpendResponse {
  balance: number
  spent: number
}

export interface POSTV1PointTokenResponse {
  token: string
  expiresAt: string
  dailyRemaining: number
}

export const postV1PointTokenRequestSchema = z.object({
  adSlotId: z.string().min(1).max(50),
})

export interface Transaction {
  id: number
  type: 'earn' | 'spend'
  amount: number
  balanceAfter: number
  description: string | null
  createdAt: string
}

export const getV1PointTransactionQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  locale: z.enum(Locale),
})

export interface GETV1PointTransactionResponse {
  items: Transaction[]
  nextCursor: number | null
}

export interface GETV1PointTurnstileResponse {
  verified: true
  expiresInSeconds: number
}

export const postV1PointTurnstileRequestSchema = z.object({
  token: turnstileTokenSchema,
})

export type POSTV1PointTurnstileResponse = GETV1PointTurnstileResponse
