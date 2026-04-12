import { notFound } from 'next/navigation'

import { getPost, getPostComment, postParamsSchema } from '../common.server'
import CommentList from './CommentList'

export default async function Page({ params }: PageProps<'/post/[id]'>) {
  const validation = postParamsSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const [post, comments] = await Promise.all([getPost(id), getPostComment(id)])

  if (!post) {
    return null
  }

  return <CommentList comments={comments} />
}
