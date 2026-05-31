'use client'

import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown'
import useMeQuery from '@/query/useMeQuery'

import DeletePostDialog from './DeletePostDialog'

type Props = {
  authorId?: number | null
  className?: string
  dropdownAlign?: 'center' | 'end' | 'start'
  fallbackUrl?: string
  postId: number
  redirectOnDelete?: boolean
}

export default function PostManagementMenu({
  authorId,
  className = '',
  dropdownAlign = 'end',
  fallbackUrl,
  postId,
  redirectOnDelete = false,
}: Props) {
  const { data: me } = useMeQuery()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const t = useTranslations('Community.delete')

  if (!me || !authorId || me.id !== authorId) {
    return null
  }

  return (
    <>
      <Dropdown>
        <DropdownTrigger aria-label={t('managementAria')} className={className}>
          <MoreHorizontal className="size-5 text-zinc-500" />
        </DropdownTrigger>
        <DropdownContent align={dropdownAlign} className="w-40 opacity-100">
          <DropdownItem className="text-red-400" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 size-4" />
            {t('menuItem')}
          </DropdownItem>
        </DropdownContent>
      </Dropdown>

      <DeletePostDialog
        fallbackUrl={fallbackUrl}
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
        postId={postId}
        redirectOnDelete={redirectOnDelete}
      />
    </>
  )
}
