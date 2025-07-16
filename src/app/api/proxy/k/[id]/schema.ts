import { z } from 'zod/v4'

export const GETProxyKIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyKIdRequest = z.infer<typeof GETProxyKIdSchema>
