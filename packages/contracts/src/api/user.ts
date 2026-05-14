import { z } from 'zod'

export type DELETEV1UserIdFollowResponse = void

export const putV1UserIdFollowResponseSchema = z.object({
  following: z.literal(true),
})

export type PUTV1UserIdFollowResponse = z.infer<typeof putV1UserIdFollowResponseSchema>
