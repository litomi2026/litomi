import { CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'
import { CENSORSHIPS_PER_PAGE, MAX_CENSORSHIPS_PER_USER } from '@litomi/domain/censorship/policy'
import { z } from 'zod'

export interface CensorshipItem {
  id: number
  key: CensorshipKey
  value: string
  level: CensorshipLevel
  createdAt: number
}

export const getV1CensorshipQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(MAX_CENSORSHIPS_PER_USER).default(CENSORSHIPS_PER_PAGE),
})

export interface GETV1CensorshipResponse {
  censorships: CensorshipItem[]
  nextCursor: string | null
}

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

export interface POSTV1CensorshipCreateResponse {
  ids: number[]
}

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

export interface PATCHV1CensorshipUpdateResponse {
  ids: number[]
}

export const deleteV1CensorshipDeleteBodySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(MAX_CENSORSHIPS_PER_USER),
})

export interface DELETEV1CensorshipDeleteResponse {
  ids: number[]
}
