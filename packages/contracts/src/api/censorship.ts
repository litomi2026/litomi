import { MAX_CENSORSHIPS_PER_USER } from '@litomi/domain/constants/policy'
import { CensorshipKey, CensorshipLevel } from '@litomi/domain/database/enum'
import { z } from 'zod'

export const censorshipItemSchema = z.object({
  id: z.number(),
  key: z.enum(CensorshipKey),
  value: z.string(),
  level: z.enum(CensorshipLevel),
  createdAt: z.number(),
})

export type CensorshipItem = z.infer<typeof censorshipItemSchema>

export const getV1CensorshipResponseSchema = z.object({
  censorships: z.array(censorshipItemSchema),
  nextCursor: z.string().nullable(),
})

export type GETV1CensorshipResponse = z.infer<typeof getV1CensorshipResponseSchema>

export const postV1CensorshipCreateBodySchema = z.object({
  items: z
    .array(
      z.object({
        key: z.enum(CensorshipKey),
        value: z.string().trim().min(1).max(256),
        level: z.enum(CensorshipLevel),
      }),
    )
    .min(1)
    .max(100),
})

export type POSTV1CensorshipCreateBody = z.infer<typeof postV1CensorshipCreateBodySchema>

export const postV1CensorshipCreateResponseSchema = z.object({
  ids: z.array(z.number()),
})

export type POSTV1CensorshipCreateResponse = z.infer<typeof postV1CensorshipCreateResponseSchema>

export const patchV1CensorshipUpdateBodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        key: z.enum(CensorshipKey),
        value: z.string().trim().min(1).max(256),
        level: z.enum(CensorshipLevel),
      }),
    )
    .min(1)
    .max(MAX_CENSORSHIPS_PER_USER),
})

export type PATCHV1CensorshipUpdateBody = z.infer<typeof patchV1CensorshipUpdateBodySchema>

export const patchV1CensorshipUpdateResponseSchema = z.object({
  ids: z.array(z.number()),
})

export type PATCHV1CensorshipUpdateResponse = z.infer<typeof patchV1CensorshipUpdateResponseSchema>

export const deleteV1CensorshipDeleteBodySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(MAX_CENSORSHIPS_PER_USER),
})

export type DELETEV1CensorshipDeleteBody = z.infer<typeof deleteV1CensorshipDeleteBodySchema>

export const deleteV1CensorshipDeleteResponseSchema = z.object({
  ids: z.array(z.number()),
})

export type DELETEV1CensorshipDeleteResponse = z.infer<typeof deleteV1CensorshipDeleteResponseSchema>
