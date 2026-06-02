import type { Metadata } from 'next'

import { PostFilter } from '@litomi/domain/post/filter'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import PostList from './PostList'
import { PostFilterParams, postFilterSchema } from './schema'

export async function generateMetadata({ params }: PageProps<'/[locale]/posts/[filter]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.community.posts' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/posts/recommend',
    }),
  }
}

const filterParamsToPostFilter = {
  [PostFilterParams.FOLLOWING]: PostFilter.FOLLOWING,
  [PostFilterParams.RECOMMEND]: PostFilter.RECOMMEND,
} satisfies Record<PostFilterParams, PostFilter.FOLLOWING | PostFilter.RECOMMEND>

export async function generateStaticParams() {
  return [{ filter: PostFilterParams.RECOMMEND }, { filter: PostFilterParams.FOLLOWING }]
}

export default async function Page({ params }: PageProps<'/[locale]/posts/[filter]'>) {
  const validation = postFilterSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { filter } = validation.data
  const postFilter = filterParamsToPostFilter[filter]

  return <PostList source={{ type: 'timeline', filter: postFilter }} />
}
