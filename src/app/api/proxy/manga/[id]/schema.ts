import { z } from 'zod/v4'

export const GETProxyMangaIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyMangaIdRequest = z.infer<typeof GETProxyMangaIdSchema>
