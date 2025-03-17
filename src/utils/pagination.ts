export function validateOrder(order: string | string[]) {
  if (Array.isArray(order)) {
    return ''
  }

  switch (order) {
    case 'asc':
      return 'asc'
    case 'desc':
      return 'desc'
    default:
      return ''
  }
}

export function validatePage(page: string | string[]) {
  if (Array.isArray(page)) {
    return 0
  }

  const pageNumber = parseInt(page, 10)

  if (isNaN(pageNumber) || !isFinite(pageNumber) || pageNumber < 1) {
    return 0
  }

  return pageNumber
}
