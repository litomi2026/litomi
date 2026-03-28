import { describe, expect, test } from 'bun:test'

import { getBulkOperationPermissions } from './bulkOperationPermissions'

describe('getBulkOperationPermissions', () => {
  test('북마크 페이지는 로그인 사용자에게 복사와 삭제를 허용한다', () => {
    expect(
      getBulkOperationPermissions({
        pathname: '/library/bookmark',
        isOwner: false,
        isPublicLibrary: undefined,
        userId: 1,
      }),
    ).toEqual({
      canSelectItems: true,
      canCopy: true,
      canMove: false,
      canDelete: true,
    })
  })

  test('감상 기록과 평가 페이지도 삭제를 허용한다', () => {
    expect(
      getBulkOperationPermissions({
        pathname: '/library/history',
        isOwner: false,
        isPublicLibrary: undefined,
        userId: 1,
      }).canDelete,
    ).toBe(true)

    expect(
      getBulkOperationPermissions({
        pathname: '/library/rating',
        isOwner: false,
        isPublicLibrary: undefined,
        userId: 1,
      }).canDelete,
    ).toBe(true)
  })

  test('내 서재는 이동과 삭제를 모두 허용한다', () => {
    expect(
      getBulkOperationPermissions({
        pathname: '/library/12',
        currentLibraryId: 12,
        isOwner: true,
        isPublicLibrary: false,
        userId: 1,
      }),
    ).toEqual({
      canSelectItems: true,
      canCopy: true,
      canMove: true,
      canDelete: true,
    })
  })

  test('남의 공개 서재는 복사만 허용한다', () => {
    expect(
      getBulkOperationPermissions({
        pathname: '/library/12',
        currentLibraryId: 12,
        isOwner: false,
        isPublicLibrary: true,
        userId: 1,
      }),
    ).toEqual({
      canSelectItems: true,
      canCopy: true,
      canMove: false,
      canDelete: false,
    })
  })
})
