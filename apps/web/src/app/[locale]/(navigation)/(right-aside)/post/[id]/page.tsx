import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import CommentList from './CommentList'
import { getPost, getPostComment, getPostConversation, postParamsSchema } from './common.server'
import ParentPost from './ParentPost'
import Post from './Post'

export async function generateMetadata({ params }: PageProps<'/[locale]/post/[id]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.community.post' })
  const validation = postParamsSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const post = await getPost(id, locale)

  if (!post) {
    notFound()
  }

  const slicedContent = post.content?.slice(0, 100) ?? t('deletedTitle')

  return {
    title: `${slicedContent}`,
    ...generateLocalizedMetadata({
      title: `${slicedContent}`,
      locale,
      pathname: `/post/${id}`,
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/post/[id]'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Community.post' })
  const validation = postParamsSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const [conversation, comments] = await Promise.all([getPostConversation(id, locale), getPostComment(id)])

  if (!conversation) {
    notFound()
  }

  return (
    <>
      {conversation.parentPosts.length > 0 && (
        <section aria-label={t('parentPostsLabel')}>
          {conversation.parentPosts.map((parentPost) => (
            <ParentPost key={parentPost.id} post={parentPost} />
          ))}
        </section>
      )}
      <Post post={conversation.post} />
      <CommentList comments={comments} />
    </>
  )
}
