import 'server-only'
import { z } from 'zod'

export const GETProxyKIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyKIdRequest = z.infer<typeof GETProxyKIdSchema>
