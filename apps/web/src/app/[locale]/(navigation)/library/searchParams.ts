'use client'

import { DEFAULT_LIBRARY_ITEM_SORT, LibraryItemSort, RatingSort } from '@litomi/domain/library/sort'

type SearchParamsLike = Pick<URLSearchParams, 'get'>

const SORT_PARAM = 'sort'
const libraryItemSorts = new Set<string>(Object.values(LibraryItemSort))
const ratingSorts = new Set<string>(Object.values(RatingSort))

export function getLibraryItemSortFromSearchParams(searchParams: SearchParamsLike) {
  const sort = searchParams.get(SORT_PARAM)
  return sort && libraryItemSorts.has(sort) ? (sort as LibraryItemSort) : DEFAULT_LIBRARY_ITEM_SORT
}

export function getRatingSortFromSearchParams(searchParams: SearchParamsLike) {
  const sort = searchParams.get(SORT_PARAM)
  return sort && ratingSorts.has(sort) ? (sort as RatingSort) : RatingSort.UPDATED_DESC
}

export function setLibraryItemSortToSearchParams(searchParams: URLSearchParams, sort: LibraryItemSort) {
  if (sort === DEFAULT_LIBRARY_ITEM_SORT) {
    searchParams.delete(SORT_PARAM)
    return
  }

  searchParams.set(SORT_PARAM, sort)
}

export function setRatingSortToSearchParams(searchParams: URLSearchParams, sort: RatingSort) {
  if (sort === RatingSort.UPDATED_DESC) {
    searchParams.delete(SORT_PARAM)
    return
  }

  searchParams.set(SORT_PARAM, sort)
}
