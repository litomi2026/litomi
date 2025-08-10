import { z } from 'zod/v4'

export const GETProxyKomiIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyKomiIdRequest = z.infer<typeof GETProxyKomiIdSchema>
