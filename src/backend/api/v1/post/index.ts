import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'

import postIdDeleteRoutes from './[id]/DELETE'
import postIdLikeRoutes from './[id]/like'
import getPostRoutes from './GET'
import getLikedPostIdsRoute from './liked'
import postCreateRoutes from './POST'

const postRoutes = new Hono<Env>()

postRoutes.route('/', getPostRoutes)
postRoutes.route('/', postCreateRoutes)
postRoutes.route('/liked', getLikedPostIdsRoute)
postRoutes.route('/:id', postIdDeleteRoutes)
postRoutes.route('/:id/like', postIdLikeRoutes)

export default postRoutes
