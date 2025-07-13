import z from 'zod/v4'

export enum MyTab {
  Bookmark = 'bookmark',
}

export const GETMyRequestSchema = z.object({
  tab: z.enum(MyTab).optional(),
})

export type GETMyRequest = z.infer<typeof GETMyRequestSchema>
