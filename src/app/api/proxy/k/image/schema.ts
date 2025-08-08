import { z } from 'zod/v4'

export const GETProxyKImageSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyKImageRequest = z.infer<typeof GETProxyKImageSchema>
