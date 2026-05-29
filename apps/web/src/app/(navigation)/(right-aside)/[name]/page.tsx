import { getUsernameFromParam } from '@litomi/std'
import { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/lib/metadata'

import { getPublicUserProfile } from './profile'
import UserPostList from './UserPostList'

export async function generateMetadata({ params }: PageProps<'/[name]'>): Promise<Metadata> {
  const { name } = await params
  const username = getUsernameFromParam(name)

  if (!username) {
    const title = '이야기'
    const url = '/@'

    return {
      title,
      ...generateOpenGraphMetadata({ title, url }),
      alternates: {
        canonical: url,
        languages: { ko: url },
      },
    }
  }

  const profile = await getPublicUserProfile(username)
  const title = profile ? `${profile.nickname} (@${profile.name}) 이야기` : '존재하지 않는 사용자'

  const description = profile
    ? `팔로우 중 ${profile.followingCount}명 · 팔로워 ${profile.followerCount}명`
    : `@${username} 사용자를 찾을 수 없어요`

  const url = `/@${profile?.name ?? username}`

  return {
    title,
    ...generateOpenGraphMetadata({
      title,
      description,
      url,
    }),
    alternates: {
      canonical: url,
      languages: { ko: url },
    },
  }
}

export default async function Page({ params }: PageProps<'/[name]'>) {
  const { name } = await params
  const username = getUsernameFromParam(name)

  if (!username) {
    return
  }

  return <UserPostList username={username} />
}
