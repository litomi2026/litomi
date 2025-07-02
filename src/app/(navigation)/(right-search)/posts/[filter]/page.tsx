import { notFound } from 'next/navigation'

import PostCard from '@/components/post/PostCard'
import { mockedPosts } from '@/mock/post'

export const dynamic = 'error'

export default async function Page() {
  if (!mockedPosts) {
    notFound()
  }

  return (
    <ul>
      {mockedPosts?.map((post) => <PostCard className="border-t-2" key={post.id} post={post} />)}
      <div className="h-10" />
    </ul>
  )
}
