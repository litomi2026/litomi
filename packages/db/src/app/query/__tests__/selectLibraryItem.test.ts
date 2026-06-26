import { describe, test } from 'bun:test'

import { runIsolatedBunTest } from '../../../../../../test/utils/run-isolated-bun-test'

describe('selectLibraryItem', () => {
  test('mocked db query builder behavior is isolated from the main test process', async () => {
    await runIsolatedBunTest(new URL('./fixtures/selectLibraryItem.fixture.ts', import.meta.url))
  })
})
