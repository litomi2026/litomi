import { Calendar, User } from 'lucide-react'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import MyPageButtons from './MyPageButtons'
import { getPublicUserProfile, type PublicUserProfile } from './profile'

type Props = {
  username: string
}

export default async function UserProfile({ username }: Props) {
  const profile = username ? await getPublicUserProfile(username) : null
  const t = await getTranslations('Profile')

  return (
    <>
      <div className="relative h-48 w-full shrink-0">
        <Image
          alt="Cover Image"
          className="object-cover"
          fill
          priority
          sizes="100vw, (min-width: 1024px) 1024px"
          src="/og-image.avif"
        />
      </div>
      <div className="grid gap-4 px-4 pb-2">
        <div className="relative -mt-16 flex justify-between items-end">
          {profile ? (
            <>
              <UserProfileIdentity imageURL={profile.imageURL} name={profile.name} nickname={profile.nickname} />
              <MyPageButtons user={profile} />
            </>
          ) : (
            <UserProfileIdentity
              name={username}
              nickname={username ? t('fallback.missingUser') : t('fallback.guest')}
            />
          )}
        </div>
        <UserProfileDescription profile={profile} username={username} />
      </div>
    </>
  )
}

async function UserProfileDescription({ profile, username }: { profile: PublicUserProfile | null; username: string }) {
  const locale = await getLocale()
  const t = await getTranslations('Profile')

  if (!username) {
    return <div className="mt-2 h-19 text-zinc-500 text-sm">{t('fallback.loginPrompt')}</div>
  }

  if (!profile) {
    return <div className="mt-2 h-19 text-zinc-500 text-sm">{t('fallback.missingDescription')}</div>
  }

  const joinedAt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(profile.createdAt),
  )

  return (
    <>
      <div className="mt-2 flex items-center gap-1 text-zinc-500 text-sm">
        <Calendar className="size-4" /> {t('summary.joinedAt', { date: joinedAt })}
      </div>
      <div className="mt-4 flex gap-6">
        <div className="flex gap-2">
          <span className="font-bold">{profile.followingCount ?? '.'}</span>
          <span className="text-zinc-500">{t('summary.following')}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold">{profile.followerCount ?? '.'}</span>
          <span className="text-zinc-500">{t('summary.followers')}</span>
        </div>
      </div>
    </>
  )
}

function UserProfileIdentity({
  imageURL,
  name,
  nickname,
}: {
  imageURL?: string | null
  name: string
  nickname: string
}) {
  return (
    <div className="flex items-end">
      <div className="w-32 aspect-square shrink-0 border-4 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
        {imageURL ? (
          <img alt="Profile Image" className="object-cover bg-zinc-900 aspect-square w-32" src={imageURL} />
        ) : (
          <User className="size-2/3 shrink-0 text-zinc-700" />
        )}
      </div>
      <div className="ml-4">
        <h1 className="text-2xl font-bold line-clamp-1 break-all">{nickname}</h1>
        <p className="text-zinc-500 font-mono break-all">@{name}</p>
      </div>
    </div>
  )
}
