import 'server-only'
import { z } from 'zod'

export const GETProxyHentaiPawIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETProxyHentaiPawIdRequest = z.infer<typeof GETProxyHentaiPawIdSchema>
