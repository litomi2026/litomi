import type { LabeledValue, Manga, MangaTag } from '@/types/manga'

import { tagCategoryNameToInt } from '@/database/enum'

import { checkDefined } from './type'

export function getViewerLink(id: number) {
  return `/manga/${id}`
}

/**
 * Merges multiple manga objects into a single manga object.
 */
export function mergeMangas(mangas: Manga[]): Manga {
  if (mangas.length === 0) {
    throw new Error('mergeMangas: Cannot merge empty manga array')
  }

  const mergedData = deduplicateCollections(mangas)
  const baseManga = mangas[0]

  return deleteUndefinedValues({
    ...baseManga,
    id: baseManga.id,
    title: getFirstTruthyValue(mangas, 'title') ?? '404 Not Found',
    count: getFirstTruthyValue(mangas, 'count'),
    date: getFirstTruthyValue(mangas, 'date'),
    like: getFirstTruthyValue(mangas, 'like'),
    likeAnonymous: getFirstTruthyValue(mangas, 'likeAnonymous'),
    type: getFirstTruthyValue(mangas, 'type'),
    viewCount: getFirstTruthyValue(mangas, 'viewCount'),
    rating: getFirstTruthyValue(mangas, 'rating'),
    uploader: getFirstTruthyValue(mangas, 'uploader'),
    harpiId: getFirstTruthyValue(mangas, 'harpiId'),
    artists: getNonEmptyArray(mergedData.artists),
    characters: getNonEmptyArray(mergedData.characters),
    group: getNonEmptyArray(mergedData.groups),
    series: getNonEmptyArray(mergedData.series),
    tags: sortLabeledValues(getNonEmptyArray(mergedData.tags)),
    related: getNonEmptyArray(mergedData.related),
    sources: mangas.map((manga) => manga.source).filter(checkDefined),
    images: getFirstImagesWithOriginal(mangas),
  })
}

/**
 * Deduplicates collections (artists, tags, etc.) from multiple manga objects.
 */
function deduplicateCollections(mangas: Manga[]) {
  const artistsMap = new Map<string, LabeledValue>()
  const charactersMap = new Map<string, LabeledValue>()
  const groupsMap = new Map<string, LabeledValue>()
  const seriesMap = new Map<string, LabeledValue>()
  const tagsMap = new Map<string, MangaTag>()
  const relatedSet = new Set<number>()

  for (const manga of mangas) {
    if (manga.artists) {
      for (const artist of manga.artists) {
        if (artist) {
          artistsMap.set(artist.value, artist)
        }
      }
    }

    if (manga.characters) {
      for (const character of manga.characters) {
        if (character) {
          charactersMap.set(character.value, character)
        }
      }
    }

    if (manga.group) {
      for (const grp of manga.group) {
        if (grp) {
          groupsMap.set(grp.value, grp)
        }
      }
    }

    if (manga.series) {
      for (const ser of manga.series) {
        if (ser) {
          seriesMap.set(ser.value, ser)
        }
      }
    }

    if (manga.tags) {
      for (const tag of manga.tags) {
        if (tag) {
          tagsMap.set(tag.value, tag)
        }
      }
    }

    if (manga.related) {
      for (const id of manga.related) {
        if (id != null) {
          relatedSet.add(id)
        }
      }
    }
  }

  return {
    artists: Array.from(artistsMap.values()),
    characters: Array.from(charactersMap.values()),
    groups: Array.from(groupsMap.values()),
    series: Array.from(seriesMap.values()),
    tags: Array.from(tagsMap.values()),
    related: Array.from(relatedSet),
  }
}

function deleteUndefinedValues<T extends Record<string, unknown>>(object: T): T {
  for (const key in object) {
    if (object[key] === undefined) {
      delete object[key]
    }
  }

  return object
}

function getFirstImagesWithOriginal(mangas: Manga[]) {
  // Prefer images that have original URLs (actual image data)
  for (const manga of mangas) {
    const images = manga.images
    if (images && images.length > 0 && images[0]?.original?.url) {
      return images
    }
  }

  // Fallback to first non-empty images (might only have thumbnails)
  for (const manga of mangas) {
    if (manga.images && manga.images.length > 0) {
      return manga.images
    }
  }

  return undefined
}

/**
 * Finds and returns the first truthy value for a given property across multiple objects.
 * Used to get the first valid value from multiple manga sources.
 */
function getFirstTruthyValue<T, K extends keyof T>(objects: T[], key: K): T[K] | undefined {
  for (const obj of objects) {
    const value = obj[key]
    if (value) {
      return value
    }
  }
  return undefined
}

/**
 * Returns the array if it's non-empty, otherwise undefined.
 * Used to exclude empty arrays from the final result.
 */
function getNonEmptyArray<T>(array: T[] | null | undefined): T[] | undefined {
  return array != null && array.length > 0 ? array : undefined
}

function sortLabeledValues(labeledValues: MangaTag[] | undefined) {
  return labeledValues?.sort((a, b) => {
    if (a.category === b.category) {
      return a.label.localeCompare(b.label)
    }
    return tagCategoryNameToInt[a.category] - tagCategoryNameToInt[b.category]
  })
}
