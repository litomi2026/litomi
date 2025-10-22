import { Hono } from 'hono'

import { getUserId } from '@/backend/utils/auth'

import type { Env } from '../..'

const user = new Hono<Env>()

user.get('/me', async (c) => {
  const userId = getUserId()
  return c.json(userId)
})

export default user
