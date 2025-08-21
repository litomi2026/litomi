import { z } from 'zod/v4'

export const GETProxyHentaiPawImagesSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyHentaiPawImagesRequest = z.infer<typeof GETProxyHentaiPawImagesSchema>
