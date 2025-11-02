import 'server-only'
import { z } from 'zod'

export const GETProxyHiyobiIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyHiyobiIdRequest = z.infer<typeof GETProxyHiyobiIdSchema>
