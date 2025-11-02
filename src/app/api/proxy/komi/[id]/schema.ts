import 'server-only'
import { z } from 'zod'

export const GETProxyKomiIdSchema = z.object({
  id: z.union([z.coerce.number().int().positive(), z.uuid()]),
})

export type GETProxyKomiIdRequest = z.infer<typeof GETProxyKomiIdSchema>
