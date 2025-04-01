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
