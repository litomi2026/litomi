import { getContext } from 'hono/context-storage'

import { Env } from '..'

export function getUserId() {
  return getContext<Env>().var.userId
}
