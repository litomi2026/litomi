export type BulkOperationPermissions = {
  canSelectItems: boolean
  canCopy: boolean
  canMove: boolean
  canDelete: boolean
}

type Params = {
  pathname: string
  isOwner: boolean
  isPublicLibrary: boolean
  userId: number | null
  currentLibraryId?: number
}

export function getBulkOperationPermissions({
  pathname,
  isOwner,
  isPublicLibrary,
  userId,
  currentLibraryId,
}: Params): BulkOperationPermissions {
  if (pathname === '/library/bookmark') {
    return {
      canSelectItems: userId != null,
      canCopy: userId != null,
      canMove: false,
      canDelete: false,
    }
  }

  if (pathname === '/library/history') {
    return {
      canSelectItems: userId != null,
      canCopy: userId != null,
      canMove: false,
      canDelete: false,
    }
  }

  if (currentLibraryId) {
    if (isOwner) {
      return {
        canSelectItems: true,
        canCopy: true,
        canMove: true,
        canDelete: true,
      }
    }

    if (isPublicLibrary) {
      return {
        canSelectItems: userId != null,
        canCopy: userId != null,
        canMove: false,
        canDelete: false,
      }
    }
  }

  return {
    canSelectItems: false,
    canCopy: false,
    canMove: false,
    canDelete: false,
  }
}
