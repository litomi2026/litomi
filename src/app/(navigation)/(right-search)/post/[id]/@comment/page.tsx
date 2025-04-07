import type { BasePageProps } from '@/types/nextjs'

import PostCard from '@/components/post/PostCard'
import { mockedPosts, samplePosts } from '@/mock/post'

export default async function Page({ params }: BasePageProps) {
  const { id } = await params
  const post = mockedPosts.find((post) => post.id === id)

  if (!post) {
    return null
  }

  return (
    <div className="min-h-screen">
      {samplePosts.map((post) => (
        <PostCard className="border-t-2" key={post.id} post={post} />
      ))}
      {mockedPosts.slice(0, 3).map((post) => (
        <PostCard className="border-t-2" key={post.id} post={post} />
      ))}
    </div>
  )
}
