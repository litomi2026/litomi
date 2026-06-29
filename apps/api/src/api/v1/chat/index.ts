import { Hono } from 'hono'

import type { Env } from '@/app'
import bubbleReadPutRoute from './creators/[handle]/bubbles/[bubbleId]/read/PUT'
import bubbleRepliesGetRoute from './creators/[handle]/bubbles/[bubbleId]/replies/GET'
import bubbleRepliesPostRoute from './creators/[handle]/bubbles/[bubbleId]/replies/POST'
import creatorsHandleGetRoute from './creators/[handle]/GET'
import creatorsHandleMessagesGetRoute from './creators/[handle]/messages/GET'
import creatorsHandleMessagesPostRoute from './creators/[handle]/messages/POST'
import creatorsHandleReadPutRoute from './creators/[handle]/read/PUT'
import threadsGetRoute from './threads/GET'

const chatRoutes = new Hono<Env>()

chatRoutes.route('/threads', threadsGetRoute)
chatRoutes.route('/creators/:handle', creatorsHandleGetRoute)
chatRoutes.route('/creators/:handle/messages', creatorsHandleMessagesGetRoute)
chatRoutes.route('/creators/:handle/messages', creatorsHandleMessagesPostRoute)
chatRoutes.route('/creators/:handle/read', creatorsHandleReadPutRoute)
chatRoutes.route('/creators/:handle/bubbles/:bubbleId/replies', bubbleRepliesGetRoute)
chatRoutes.route('/creators/:handle/bubbles/:bubbleId/replies', bubbleRepliesPostRoute)
chatRoutes.route('/creators/:handle/bubbles/:bubbleId/read', bubbleReadPutRoute)

export default chatRoutes
