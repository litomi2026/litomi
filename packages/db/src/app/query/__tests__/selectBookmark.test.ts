import { describe, test } from 'bun:test'

import { runIsolatedBunTest } from '../../../../../../test/utils/run-isolated-bun-test'

describe('selectBookmark', () => {
  test('mocked db query builder behavior is isolated from the main test process', async () => {
    await runIsolatedBunTest(new URL('./fixtures/selectBookmark.fixture.ts', import.meta.url))
  })
})
