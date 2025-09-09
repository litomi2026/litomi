import type { Manga, MangaTag } from '@/types/manga'

import { tagCategoryNameToInt } from '@/database/enum'

import { uniqBy } from './array'
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
  const mergedArtists = uniqBy(mangas.flatMap((m) => m.artists).filter(checkDefined), 'value')
  const mergedCharacters = uniqBy(mangas.flatMap((m) => m.characters).filter(checkDefined), 'value')
  const mergedGroups = uniqBy(mangas.flatMap((m) => m.group).filter(checkDefined), 'value')
  const mergedSeries = uniqBy(mangas.flatMap((m) => m.series).filter(checkDefined), 'value')
  const mergedTags = uniqBy(mangas.flatMap((m) => m.tags).filter(checkDefined), 'value')
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

function sortLabeledValues(labeledValues: MangaTag[] | undefined) {
  return labeledValues?.sort((a, b) => {
    if (a.category === b.category) {
      return a.label.localeCompare(b.label)
    }
    return tagCategoryNameToInt[a.category] - tagCategoryNameToInt[b.category]
  })
}
