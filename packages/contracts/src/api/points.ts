import { ROULETTE_CONFIG, type RouletteSegment } from '@litomi/domain/constants/roulette'
import { z } from 'zod'

export const getV1PointsResponseSchema = z.object({
  balance: z.number(),
  totalEarned: z.number(),
  totalSpent: z.number(),
})

export type GETV1PointsResponse = z.infer<typeof getV1PointsResponseSchema>

export const getV1PointsDonationsMeRecipientSchema = z.object({
  type: z.enum(['artist', 'group']),
  value: z.string(),
  label: z.string(),
  amount: z.number(),
})

export type GETV1PointsDonationsMeRecipient = z.infer<typeof getV1PointsDonationsMeRecipientSchema>

export const getV1PointsDonationsMeItemSchema = z.object({
  id: z.number(),
  totalAmount: z.number(),
  createdAt: z.string(),
  recipients: z.array(getV1PointsDonationsMeRecipientSchema),
})

export type GETV1PointsDonationsMeItem = z.infer<typeof getV1PointsDonationsMeItemSchema>

export const getV1PointsDonationsMeResponseSchema = z.object({
  items: z.array(getV1PointsDonationsMeItemSchema),
  nextCursor: z.number().nullable(),
})

export type GETV1PointsDonationsMeResponse = z.infer<typeof getV1PointsDonationsMeResponseSchema>

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

export const postV1PointsDonationCreateResponseSchema = z.object({
  balance: z.number(),
  donationId: z.number(),
  totalAmount: z.number(),
  recipients: z.array(z.object({ type: z.enum(['artist', 'group']), value: z.string(), amount: z.number() })),
})

export type POSTV1PointsDonationCreateResponse = z.infer<typeof postV1PointsDonationCreateResponseSchema>

export const getV1PointsDonationRecipientQuerySchema = z.object({
  type: z.enum(['artist', 'group']),
  value: z.string().min(1),
})

export type GETV1PointsDonationRecipientQuery = z.infer<typeof getV1PointsDonationRecipientQuerySchema>

export const getV1PointsDonationRecipientResponseSchema = z.object({
  totalReceived: z.number(),
})

export type GETV1PointsDonationRecipientResponse = z.infer<typeof getV1PointsDonationRecipientResponseSchema>

export const getV1PointsDonationsMeQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
})

export type GETV1PointsDonationsMeQuery = z.infer<typeof getV1PointsDonationsMeQuerySchema>

export const deleteV1PointsDonationParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DELETEV1PointsDonationParam = z.infer<typeof deleteV1PointsDonationParamSchema>

export const postV1PointEarnRequestSchema = z.object({
  token: z.string().length(64),
})

export type POSTV1PointEarnRequest = z.infer<typeof postV1PointEarnRequestSchema>

export const postV1PointEarnResponseSchema = z.object({
  balance: z.number(),
  earned: z.number(),
  dailyRemaining: z.number(),
})

export type POSTV1PointEarnResponse = z.infer<typeof postV1PointEarnResponseSchema>

export const expansionInfoSchema = z.object({
  base: z.number(),
  extra: z.number(),
  current: z.number(),
  max: z.number(),
  canExpand: z.boolean(),
  price: z.number(),
  unit: z.number(),
})

export type ExpansionInfo = z.infer<typeof expansionInfoSchema>

export const getV1PointExpansionResponseSchema = z.object({
  library: expansionInfoSchema,
  history: expansionInfoSchema,
  rating: expansionInfoSchema,
  bookmark: expansionInfoSchema,
  pinnedLibrary: expansionInfoSchema,
})

export type GETV1PointExpansionResponse = z.infer<typeof getV1PointExpansionResponseSchema>

export const postV1RouletteSpinRequestSchema = z.object({
  bet: z.coerce.number().int().min(ROULETTE_CONFIG.minBet).max(ROULETTE_CONFIG.maxBet).positive(),
})

export type POSTV1RouletteSpinRequest = z.infer<typeof postV1RouletteSpinRequestSchema>

export const postV1RouletteSpinResponseSchema = z.object({
  balance: z.number(),
  bet: z.number(),
  payout: z.number(),
  net: z.number(),
  landed: z.object({
    id: z.custom<RouletteSegment['id']>(),
    label: z.string(),
    payoutMultiplierX100: z.number(),
  }),
})

export type POSTV1RouletteSpinResponse = z.infer<typeof postV1RouletteSpinResponseSchema>

export const postV1PointSpendRequestSchema = z.object({
  type: z.enum(['library', 'history', 'pinned_library', 'rating', 'bookmark', 'badge', 'theme']),
  itemId: z.string().optional(),
})

export type POSTV1PointSpendRequest = z.infer<typeof postV1PointSpendRequestSchema>

export const postV1PointSpendResponseSchema = z.object({
  balance: z.number(),
  spent: z.number(),
})

export type POSTV1PointSpendResponse = z.infer<typeof postV1PointSpendResponseSchema>

export const postV1PointTokenResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
  dailyRemaining: z.number(),
})

export type POSTV1PointTokenResponse = z.infer<typeof postV1PointTokenResponseSchema>

export const postV1PointTokenRequestSchema = z.object({
  adSlotId: z.string().min(1).max(50),
})

export type POSTV1PointTokenRequest = z.infer<typeof postV1PointTokenRequestSchema>

export const transactionSchema = z.object({
  id: z.number(),
  type: z.enum(['earn', 'spend']),
  amount: z.number(),
  balanceAfter: z.number(),
  description: z.string().nullable(),
  createdAt: z.string(),
})

export type Transaction = z.infer<typeof transactionSchema>

export const getV1PointTransactionQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
})

export type GETV1PointTransactionQuery = z.infer<typeof getV1PointTransactionQuerySchema>

export const getV1PointTransactionResponseSchema = z.object({
  items: z.array(transactionSchema),
  nextCursor: z.number().nullable(),
})

export type GETV1PointTransactionResponse = z.infer<typeof getV1PointTransactionResponseSchema>

export const getV1PointTurnstileResponseSchema = z.object({
  verified: z.literal(true),
  expiresInSeconds: z.number(),
})

export type GETV1PointTurnstileResponse = z.infer<typeof getV1PointTurnstileResponseSchema>

export const postV1PointTurnstileRequestSchema = z.object({
  token: z.string().min(1).max(2048),
})

export type POSTV1PointTurnstileRequest = z.infer<typeof postV1PointTurnstileRequestSchema>

export const postV1PointTurnstileResponseSchema = getV1PointTurnstileResponseSchema

export type POSTV1PointTurnstileResponse = z.infer<typeof postV1PointTurnstileResponseSchema>
