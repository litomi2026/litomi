import { notFound } from 'next/navigation'

import { getPostComment, postParamsSchema } from '../common.server'
import CommentList from './CommentList'

export default async function Page({ params }: PageProps<'/post/[id]'>) {
  const validation = postParamsSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const comments = await getPostComment(id)

  return <CommentList comments={comments} />
}
