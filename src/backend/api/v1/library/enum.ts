export enum RatingSort {
  RATING_DESC = 'rating-desc',
  RATING_ASC = 'rating-asc',
  UPDATED_DESC = 'updated-desc',
  CREATED_DESC = 'created-desc',
  MANGA_ID_DESC = 'manga-id-desc',
  MANGA_ID_ASC = 'manga-id-asc',
}

export function isGroupedRatingSort(sort: RatingSort) {
  return sort === RatingSort.RATING_DESC || sort === RatingSort.RATING_ASC
}
