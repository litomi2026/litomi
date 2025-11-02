import 'server-only'
import { z } from 'zod'

export const GETProxyHentaiPawImagesSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyHentaiPawImagesRequest = z.infer<typeof GETProxyHentaiPawImagesSchema>
