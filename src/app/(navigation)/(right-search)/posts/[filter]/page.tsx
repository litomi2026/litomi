import PostCard from '@/components/post/PostCard'
import { mockedPosts } from '@/mock/post'
import { notFound } from 'next/navigation'

export const dynamic = 'error'

export default async function Page() {
  if (!mockedPosts) {
    notFound()
  }

  return (
    <ul>
      {mockedPosts?.map((post) => <PostCard key={post.id} post={post} />)}
      <div className="h-20" />
    </ul>
  )
}
