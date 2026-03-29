export type BulkOperationPermissions = {
  canSelectItems: boolean
  canCopy: boolean
  canMove: boolean
  canDelete: boolean
}

type BulkOperationPageKind = 'bookmark' | 'browse' | 'detail' | 'history' | 'rating'

type CurrentLibrary = {
  id: number
  isPublic: boolean
  userId: number
}

const SIGNED_IN_COLLECTION_PERMISSIONS = {
  canCopy: true,
  canDelete: true,
  canMove: false,
  canSelectItems: true,
} satisfies BulkOperationPermissions

const UNAVAILABLE_PERMISSIONS = {
  canCopy: false,
  canDelete: false,
  canMove: false,
  canSelectItems: false,
} satisfies BulkOperationPermissions

export function getBulkOperationPermissions(
  pageKind: BulkOperationPageKind,
  currentLibrary: CurrentLibrary | null | undefined,
  userId?: number,
): BulkOperationPermissions {
  if (pageKind === 'bookmark' || pageKind === 'history' || pageKind === 'rating') {
    if (userId) {
      return SIGNED_IN_COLLECTION_PERMISSIONS
    }

    return UNAVAILABLE_PERMISSIONS
  }

  if (pageKind !== 'detail' || !currentLibrary) {
    return UNAVAILABLE_PERMISSIONS
  }

  if (currentLibrary.userId === userId) {
    return {
      canSelectItems: true,
      canCopy: true,
      canMove: true,
      canDelete: true,
    }
  }

  if (currentLibrary.isPublic) {
    return {
      canSelectItems: Boolean(userId),
      canCopy: Boolean(userId),
      canMove: false,
      canDelete: false,
    }
  }

  return UNAVAILABLE_PERMISSIONS
}
