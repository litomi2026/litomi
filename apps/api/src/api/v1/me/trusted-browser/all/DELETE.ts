import type { DELETEV1MeTrustedBrowserAllResponse } from '@litomi/contracts'

import { db } from '@litomi/db/app'
import { trustedBrowserTable } from '@litomi/db/app/two-factor'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

const route = new Hono<Env>()

route.delete('/', async (c) => {
  const userId = c.get('userId')!

  try {
    await db.delete(trustedBrowserTable).where(eq(trustedBrowserTable.userId, userId))

    return c.json({ message: '모든 브라우저가 제거됐어요' } satisfies DELETEV1MeTrustedBrowserAllResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '브라우저 제거에 실패했어요' })
  }
})

export default route
