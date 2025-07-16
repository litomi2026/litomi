import { z } from 'zod/v4'

export const GETProxyHiyobiIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyHiyobiIdRequest = z.infer<typeof GETProxyHiyobiIdSchema>
