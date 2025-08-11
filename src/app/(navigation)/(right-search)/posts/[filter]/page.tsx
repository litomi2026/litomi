import { notFound } from 'next/navigation'

import { PostFilter } from '@/app/api/post/schema'
import { PageProps } from '@/types/nextjs'

import PostList from './PostList'
import { PostFilterParams, postFilterSchema } from './schema'

export const dynamic = 'error'

type Params = {
  filter: PostFilterParams
}

// Map string filter params to numeric PostFilter enum
const filterParamsToPostFilter: Record<PostFilterParams, PostFilter> = {
  [PostFilterParams.Following]: PostFilter.FOLLOWING,
  [PostFilterParams.Recommand]: PostFilter.RECOMMAND,
}

export async function generateStaticParams() {
  return [{ filter: PostFilterParams.Recommand }, { filter: PostFilterParams.Following }]
}

export default async function Page({ params }: PageProps<Params>) {
  const validation = postFilterSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { filter } = validation.data
  const postFilter = filterParamsToPostFilter[filter]

  if (postFilter === undefined) {
    notFound()
  }

  return <PostList filter={postFilter} />
}
