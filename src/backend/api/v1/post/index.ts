import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'

import postIdDeleteRoutes from './[id]/DELETE'
import postIdLikeRoutes from './[id]/like/POST'
import getPostRoutes from './GET'
import postCreateRoutes from './POST'

export type { GETV1PostResponse, Post } from './GET'

const postRoutes = new Hono<Env>()

postRoutes.route('/', getPostRoutes)
postRoutes.route('/', postCreateRoutes)
postRoutes.route('/:id', postIdDeleteRoutes)
postRoutes.route('/:id/like', postIdLikeRoutes)

export default postRoutes
