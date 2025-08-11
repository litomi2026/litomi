import { notFound } from 'next/navigation'

import { PageProps } from '@/types/nextjs'

import PostList from './PostList'
import { PostFilterParams, postFilterSchema } from './schema'

export const dynamic = 'error'

type Params = {
  filter: PostFilterParams
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

  return <PostList filter={filter} />
}
