import PostItem from '@/components/post/PostItem'
import { mockedPosts } from '@/mock/post'
import { notFound } from 'next/navigation'

export const dynamic = 'error'

export default async function Page() {
  if (!mockedPosts) {
    notFound()
  }

  return (
    <ul>
      <h2 className="text-center font-bold text-xl py-4">준비중입니다</h2>
      {mockedPosts?.map((post) => <PostItem key={post.id} post={post} />)}
      <div className="h-20" />
    </ul>
  )
}
