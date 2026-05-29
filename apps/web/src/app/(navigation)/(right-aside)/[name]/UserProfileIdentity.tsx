'use client'

import { User } from 'lucide-react'

import useMeQuery from '@/query/useMeQuery'

type Props = {
  user: {
    id: number
    name: string
    nickname: string
    imageURL: string | null
  }
}

export default function UserProfileIdentity({ user }: Props) {
  const { data: me } = useMeQuery()
  const displayUser = me?.id === user.id ? me : user

  return (
    <div className="flex items-end">
      <div className="w-32 aspect-square shrink-0 border-4 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
        {displayUser.imageURL ? (
          <img alt="Profile Image" className="object-cover bg-zinc-900 aspect-square w-32" src={displayUser.imageURL} />
        ) : (
          <User className="size-2/3 shrink-0 text-zinc-700" />
        )}
      </div>
      <div className="ml-4">
        <h1 className="text-2xl font-bold line-clamp-1 break-all">{displayUser.nickname}</h1>
        <p className="text-zinc-500 font-mono break-all">@{displayUser.name}</p>
      </div>
    </div>
  )
}
