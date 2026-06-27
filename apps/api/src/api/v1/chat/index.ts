import { Hono } from 'hono'

import type { Env } from '@/app'

import postChatMessageRoute from './POST'

const chatRoutes = new Hono<Env>()

chatRoutes.route('/', postChatMessageRoute)

export default chatRoutes
