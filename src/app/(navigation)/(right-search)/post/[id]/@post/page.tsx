import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { generateOpenGraphMetadata } from '@/constants'

import { getPost, postParamsSchema } from '../common.server'
import Post from './Post'

export async function generateMetadata({ params }: PageProps<'/post/[id]'>): Promise<Metadata> {
  const validation = postParamsSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  const slicedContent = post.content?.slice(0, 100) ?? '삭제된 글이에요'

  return {
    title: `${slicedContent}`,
    ...generateOpenGraphMetadata({
      title: `${slicedContent}`,
      url: `/post/${id}`,
    }),
    alternates: {
      canonical: `/post/${id}`,
      languages: { ko: `/post/${id}` },
    },
  }
}

export default async function Page({ params }: PageProps<'/post/[id]'>) {
  const validation = postParamsSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const post = await getPost(id)

  if (!post) {
    notFound()
  }

  return <Post post={post} />
}
