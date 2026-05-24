import { MangaSource } from '@litomi/domain/manga/model'
import { z } from 'zod'

export const imageVariantSchema = z.object({
  url: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
})

export const imageWithVariantsSchema = z.object({
  original: imageVariantSchema.optional(),
  thumbnail: imageVariantSchema.optional(),
  medium: imageVariantSchema.optional(),
})

export const labeledValueSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const labeledValueWithLinkSchema = labeledValueSchema.extend({
  links: z.array(labeledValueSchema).optional(),
})

export const mangaTagSchema = labeledValueSchema.extend({
  category: z.string(),
})

export const mangaTorrentSchema = z.object({
  added: z.number(),
  fsize: z.number(),
  hash: z.string(),
  name: z.string(),
  tsize: z.number(),
})

export const catalogMangaSchema = z.object({
  id: z.number(),
  title: z.string(),
  images: z.array(imageWithVariantsSchema).optional(),
  artists: z.array(labeledValueWithLinkSchema).optional(),
  bookmarkCount: z.number().optional(),
  characters: z.array(labeledValueWithLinkSchema).optional(),
  count: z.number().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  filesize: z.number().optional(),
  group: z.array(labeledValueSchema).optional(),
  harpiId: z.string().optional(),
  languages: z.array(labeledValueSchema).optional(),
  like: z.number().optional(),
  likeAnonymous: z.number().optional(),
  lines: z.array(z.string()).optional(),
  rating: z.number().optional(),
  ratingCount: z.number().optional(),
  related: z.array(z.number()).optional(),
  series: z.array(labeledValueSchema).optional(),
  source: z.enum(MangaSource).optional(),
  sources: z.array(z.enum(MangaSource)).optional(),
  tags: z.array(mangaTagSchema).optional(),
  torrentCount: z.number().optional(),
  torrents: z.array(mangaTorrentSchema).optional(),
  type: labeledValueSchema.optional(),
  uploader: z.string().optional(),
  viewCount: z.number().optional(),
})

export type CatalogManga = z.infer<typeof catalogMangaSchema>
