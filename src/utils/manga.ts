import type { LabeledValue, Manga, MangaTag } from '@/types/manga'

import { checkDefined } from './type'

type Params = {
  origin?: string
  imageURL: string
}

export function getImageSource({ imageURL, origin }: Params) {
  if (origin) {
    return `${origin}${imageURL}`
  }

  return imageURL
}

export function getViewerLink(id: number) {
  return `/manga/${id}`
}

export function mergeMangas(mangas: Manga[]) {
  const mergedArtists = deduplicateLabeledValues(mangas.flatMap((m) => m.artists).filter(checkDefined))
  const mergedCharacters = deduplicateLabeledValues(mangas.flatMap((m) => m.characters).filter(checkDefined))
  const mergedGroups = deduplicateLabeledValues(mangas.flatMap((m) => m.group).filter(checkDefined))
  const mergedSeries = deduplicateLabeledValues(mangas.flatMap((m) => m.series).filter(checkDefined))
  const mergedTags = deduplicateLabeledValues(mangas.flatMap((m) => m.tags).filter(checkDefined))
  const mergedRelated = Array.from(new Set(mangas.flatMap((m) => m.related).filter(checkDefined)))

  return deleteUndefinedValues({
    ...mangas[0],
    id: mangas[0].id,
    title: getExistingValue(mangas, 'title') ?? '404 Not Found',
    count: getExistingValue(mangas, 'count'),
    date: getExistingValue(mangas, 'date'),
    like: getExistingValue(mangas, 'like'),
    likeAnonymous: getExistingValue(mangas, 'likeAnonymous'),
    type: getExistingValue(mangas, 'type'),
    viewCount: getExistingValue(mangas, 'viewCount'),
    rating: getExistingValue(mangas, 'rating'),
    uploader: getExistingValue(mangas, 'uploader'),
    harpiId: getExistingValue(mangas, 'harpiId'),
    artists: getExistingArray(mergedArtists),
    characters: getExistingArray(mergedCharacters),
    group: getExistingArray(mergedGroups),
    series: getExistingArray(mergedSeries),
    tags: sortLabeledValues(getExistingArray(mergedTags)),
    related: getExistingArray(mergedRelated),
  })
}

function deduplicateLabeledValues<T extends LabeledValue>(items: T[]) {
  if (items.length === 0) {
    return null
  }

  const seen = new Set<string>()

  return items.filter((item) => {
    if (seen.has(item.value)) {
      return false
    }
    seen.add(item.value)
    return true
  })
}

function deleteUndefinedValues<T extends Record<string, unknown>>(object: T): T {
  for (const key in object) {
    if (object[key] === undefined) {
      delete object[key]
    }
  }

  return object
}

function getExistingArray<T>(array: T[] | null | undefined): T[] | undefined {
  return array != null && array.length > 0 ? array : undefined
}

function getExistingValue<T, K extends keyof T>(validMangas: T[], key: K): T[K] | undefined {
  for (const manga of validMangas) {
    const value = manga[key]
    if (value) {
      return value
    }
  }
  return undefined
}

const categoryOrder: Record<string, number> = {
  female: 4,
  male: 3,
  mixed: 2,
  other: 1,
}

function sortLabeledValues(labeledValues?: MangaTag[]) {
  return labeledValues?.sort((a, b) => {
    const categoryDiff = (categoryOrder[b.category] ?? 0) - (categoryOrder[a.category] ?? 0)

    if (categoryDiff !== 0) {
      return categoryDiff
    }

    return a.label.localeCompare(b.label)
  })
}
