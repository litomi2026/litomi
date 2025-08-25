import { z } from 'zod/v4'

export const GETProxyMangaIdSchema = z.object({
  id: z.coerce.number().int().positive().max(10_000_000), // NOTE: 꾸준히 올려줘야 함
})

export type GETProxyMangaIdRequest = z.infer<typeof GETProxyMangaIdSchema>
