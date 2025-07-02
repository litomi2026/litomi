import { notFound } from 'next/navigation'

import type { BasePageProps } from '@/types/nextjs'

import { mockedPosts } from '@/mock/post'

import Post from './Post'

export default async function Page({ params }: BasePageProps) {
  const { id } = await params
  const post = mockedPosts.find((post) => post.id === id)

  if (!post) {
    notFound()
  }

  return <Post post={post} />
}
