export function validateId(id: string) {
  const idNumber = parseInt(id, 10)

  if (isNaN(idNumber) || !isFinite(idNumber) || idNumber < 1) {
    return 0
  }

  return idNumber
}

export function validateOrder(order: string) {
  switch (order) {
    case 'asc':
      return 'asc'
    case 'desc':
      return 'desc'
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
    case 'id':
      return 'id'
    default:
      return ''
  }
}

export function validateSource(src: string) {
  switch (src) {
    case 'ha':
      return 'ha'
    case 'hi':
      return 'hi'
    case 'hp':
      return 'hp'
    default:
      return ''
  }
}
