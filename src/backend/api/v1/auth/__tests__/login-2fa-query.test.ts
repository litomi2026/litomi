import { describe, expect, mock, test } from 'bun:test'

import { MAX_TRUSTED_DEVICES_PER_USER } from '@/constants/policy'

import { registerTrustedBrowser } from '../login/2fa/query'

type RegisterTrustedBrowserTx = Parameters<typeof registerTrustedBrowser>[0]

function createTransactionDouble() {
  const onConflictDoUpdate = mock(async () => {})
  const values = mock((_insertValues: unknown) => ({
    onConflictDoUpdate,
  }))
  const insert = mock((_table: unknown) => ({
    values,
  }))
  const deleteWhere = mock(async (_condition: unknown) => {})
  const deleteFn = mock((_table: unknown) => ({
    where: deleteWhere,
  }))
  const limit = mock((_count: number) => ({}))
  const orderBy = mock((..._orderBy: Array<unknown>) => ({
    limit,
  }))
  const selectWhere = mock((_condition: unknown) => ({
    orderBy,
  }))
  const from = mock((_table: unknown) => ({
    where: selectWhere,
  }))
  const select = mock((_fields: unknown) => ({
    from,
  }))

  return {
    tx: {
      delete: deleteFn,
      insert,
      select,
    } as unknown as RegisterTrustedBrowserTx,
    deleteFn,
    deleteWhere,
    from,
    insert,
    limit,
    orderBy,
    select,
    selectWhere,
    values,
    onConflictDoUpdate,
  }
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'

describe('registerTrustedBrowser', () => {
  test('같은 사용자와 fingerprint면 같은 browserId를 재사용한다', async () => {
    const first = createTransactionDouble()
    const second = createTransactionDouble()

    const firstBrowserId = await registerTrustedBrowser(first.tx, 7, 'fingerprint-a', USER_AGENT)
    const secondBrowserId = await registerTrustedBrowser(second.tx, 7, 'fingerprint-a', USER_AGENT)

    expect(firstBrowserId).toBe(secondBrowserId)
    expect(first.deleteFn).toHaveBeenCalledTimes(1)
    expect(first.select).toHaveBeenCalledTimes(1)
    expect(first.insert).toHaveBeenCalledTimes(1)

    const [firstInsertValues] = first.values.mock.calls[0]
    const [secondInsertValues] = second.values.mock.calls[0]

    expect(firstInsertValues).toMatchObject({
      userId: 7,
      browserId: firstBrowserId,
    })
    expect(secondInsertValues).toMatchObject({
      userId: 7,
      browserId: secondBrowserId,
    })
  })

  test('userId나 fingerprint가 달라지면 browserId도 달라진다', async () => {
    const first = createTransactionDouble()
    const second = createTransactionDouble()
    const third = createTransactionDouble()

    const baseBrowserId = await registerTrustedBrowser(first.tx, 7, 'fingerprint-a', USER_AGENT)
    const differentUserBrowserId = await registerTrustedBrowser(second.tx, 8, 'fingerprint-a', USER_AGENT)
    const differentFingerprintBrowserId = await registerTrustedBrowser(third.tx, 7, 'fingerprint-b', USER_AGENT)

    expect(baseBrowserId).not.toBe(differentUserBrowserId)
    expect(baseBrowserId).not.toBe(differentFingerprintBrowserId)
  })

  test('보존 개수만큼 active trusted browser를 남기는 정리 서브쿼리를 만든다', async () => {
    const txDouble = createTransactionDouble()

    await registerTrustedBrowser(txDouble.tx, 7, 'fingerprint-a', USER_AGENT)

    expect(txDouble.limit).toHaveBeenCalledWith(MAX_TRUSTED_DEVICES_PER_USER)
    expect(txDouble.deleteFn).toHaveBeenCalledTimes(1)
    expect(txDouble.deleteWhere).toHaveBeenCalledTimes(1)
  })
})
