'use client'

import { User } from 'lucide-react'
import { useTranslations } from 'next-intl'

import useMeQuery from '@/query/useMeQuery'

import SelectableLink from './SelectableLink'

type Props = {
  className?: string
}

export default function ProfileLink({ className }: Props) {
  const t = useTranslations('Profile.navigation')
  const { data: me } = useMeQuery()

  const name = me?.name ?? ''
  const href = `/@${name}`

  return (
    <SelectableLink className={className} href={href} hrefMatch={href} icon={<User />} selectedIconStyle="fill">
      {t('myLitomi')}
    </SelectableLink>
  )
}
