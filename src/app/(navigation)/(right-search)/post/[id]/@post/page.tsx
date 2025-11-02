import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { z } from 'zod'

import { generateOpenGraphMetadata } from '@/constants'
import selectPosts from '@/sql/selectPosts'

import Post from './Post'

const schema = z.object({
  id: z.coerce.number().int().positive(),
})

export async function generateMetadata({ params }: PageProps<'/post/[id]'>): Promise<Metadata> {
  const validation = schema.safeParse(await params)

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
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const post = await getPost(id)

  return <Post post={post} />
}

const getPost = cache(async (id: number) => {
  const [post] = await selectPosts({ limit: 1, cursor: id + 1 })
  return post
})
