import { Hono } from 'hono'

import type { Env } from '@/app'
import artistHandleGetRoute from './artist/[handle]/GET'
import messageReadPutRoute from './artist/[handle]/message/[messageId]/read/PUT'
import messageReplyGetRoute from './artist/[handle]/message/[messageId]/reply/GET'
import messageReplyPostRoute from './artist/[handle]/message/[messageId]/reply/POST'
import artistHandleMessageGetRoute from './artist/[handle]/message/GET'
import artistHandleMessagePostRoute from './artist/[handle]/message/POST'
import artistHandleReadPutRoute from './artist/[handle]/read/PUT'
import threadsGetRoute from './threads/GET'

const chatRoutes = new Hono<Env>()

chatRoutes.route('/threads', threadsGetRoute)
chatRoutes.route('/artist/:handle', artistHandleGetRoute)
chatRoutes.route('/artist/:handle/message', artistHandleMessageGetRoute)
chatRoutes.route('/artist/:handle/message', artistHandleMessagePostRoute)
chatRoutes.route('/artist/:handle/read', artistHandleReadPutRoute)
chatRoutes.route('/artist/:handle/message/:messageId/reply', messageReplyGetRoute)
chatRoutes.route('/artist/:handle/message/:messageId/reply', messageReplyPostRoute)
chatRoutes.route('/artist/:handle/message/:messageId/read', messageReadPutRoute)

export default chatRoutes
