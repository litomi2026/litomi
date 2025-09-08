import { z } from 'zod/v4'

export const GETProxyKomiIdSchema = z.object({
  id: z.union([z.coerce.number().int().positive(), z.uuid()]),
})

export type GETProxyKomiIdRequest = z.infer<typeof GETProxyKomiIdSchema>
