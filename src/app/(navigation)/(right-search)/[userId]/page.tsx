import PostCard from '@/components/post/PostCard'
import { mockedPosts } from '@/mock/post'
import { sampleBySecureFisherYates } from '@/utils/random'

export default async function Page() {
  return (
    <ul>
      {sampleBySecureFisherYates(mockedPosts, 5)?.map((post) => (
        <PostCard className="border-t-2 first-of-type:border-none" key={post.id} post={post} />
      ))}
      <div className="h-10" />
    </ul>
  )
}
