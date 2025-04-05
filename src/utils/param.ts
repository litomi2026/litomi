export enum OrderParam {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortParam {
  ID = 'id',
  // BOOKMARK = 'bookmark',
  // DATE = 'date',
  // LIKE = 'like',
}

export enum SourceParam {
  HIYOBI = 'hi',
  HASHA = 'ha',
  HARPI = 'hp',
}

export function getUserId(userId: string) {
  return decodeURIComponent(userId).slice(1)
}

export function validateId(id: string) {
  const idNumber = parseInt(id, 10)

  if (isNaN(idNumber) || !isFinite(idNumber) || idNumber < 1) {
    return 0
  }

  return idNumber
}

export function validateOrder(order: string) {
  switch (order) {
    case OrderParam.ASC:
      return OrderParam.ASC
    case OrderParam.DESC:
      return OrderParam.DESC
    default:
      return ''
  }
}

export function validatePage(page: string) {
  const pageNumber = parseInt(page, 10)

  if (isNaN(pageNumber) || !isFinite(pageNumber) || pageNumber < 1) {
    return 0
  }

  return pageNumber
}

export function validatePositiveNumber(str?: string | null) {
  if (!str) return 0

  const num = parseInt(str, 10)

  if (isNaN(num) || !isFinite(num) || num < 1 || num > Number.MAX_SAFE_INTEGER) {
    return 0
  }

  return num
}

export function validatePostFilter(str: string) {
  switch (str) {
    case 'following':
      return 'following'
    case 'recommand':
      return 'recommand'
    default:
      return ''
  }
}

export function validateSort(order: string) {
  switch (order) {
    case SortParam.ID:
      return SortParam.ID
    default:
      return ''
  }
}

export function validateSource(src: string) {
  switch (src) {
    case SourceParam.HARPI:
      return SourceParam.HARPI
    case SourceParam.HASHA:
      return SourceParam.HASHA
    case SourceParam.HIYOBI:
      return SourceParam.HIYOBI
    default:
      return ''
  }
}
