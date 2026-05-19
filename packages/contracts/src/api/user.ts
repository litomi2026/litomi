import { z } from 'zod'

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DELETEV1UserIdFollowResponse = void

export type UserIdParam = z.infer<typeof userIdParamSchema>

export const putV1UserIdFollowResponseSchema = z.object({
  following: z.literal(true),
})

export type PUTV1UserIdFollowResponse = z.infer<typeof putV1UserIdFollowResponseSchema>
