import { z } from 'zod/v4'

export const GETProxyHentaiPawIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyHentaiPawIdRequest = z.infer<typeof GETProxyHentaiPawIdSchema>
