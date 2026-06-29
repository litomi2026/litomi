import { Hono } from 'hono'

import type { Env } from '@/app'
import creatorsHandleFansFanIdMessagesGetRoute from './creators/[handle]/fans/[fanId]/messages/GET'
import creatorsHandleFansFanIdMessagesPostRoute from './creators/[handle]/fans/[fanId]/messages/POST'
import creatorsHandleFansFanIdReadPutRoute from './creators/[handle]/fans/[fanId]/read/PUT'
import creatorsHandleFansGetRoute from './creators/[handle]/fans/GET'
import creatorsHandleMessagesGetRoute from './creators/[handle]/messages/GET'
import creatorsHandleMessagesPostRoute from './creators/[handle]/messages/POST'
import creatorsHandleReadPutRoute from './creators/[handle]/read/PUT'
import threadsGetRoute from './threads/GET'

const chatRoutes = new Hono<Env>()

chatRoutes.route('/threads', threadsGetRoute)
chatRoutes.route('/creators/:handle/messages', creatorsHandleMessagesGetRoute)
chatRoutes.route('/creators/:handle/messages', creatorsHandleMessagesPostRoute)
chatRoutes.route('/creators/:handle/read', creatorsHandleReadPutRoute)
chatRoutes.route('/creators/:handle/fans', creatorsHandleFansGetRoute)
chatRoutes.route('/creators/:handle/fans/:fanId/messages', creatorsHandleFansFanIdMessagesGetRoute)
chatRoutes.route('/creators/:handle/fans/:fanId/messages', creatorsHandleFansFanIdMessagesPostRoute)
chatRoutes.route('/creators/:handle/fans/:fanId/read', creatorsHandleFansFanIdReadPutRoute)

export default chatRoutes
