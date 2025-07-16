import { notFound } from 'next/navigation'

import type { PageProps } from '@/types/nextjs'

import { mockedPosts } from '@/mock/post'

import Post from './Post'

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const post = mockedPosts.find((post) => post.id === id)

  if (!post) {
    notFound()
  }

  return <Post post={post} />
}
