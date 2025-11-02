import 'server-only'
import { z } from 'zod'

export const GETProxyKImageSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyKImageRequest = z.infer<typeof GETProxyKImageSchema>
