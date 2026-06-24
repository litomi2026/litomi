'use client'

import { Edit, MoreVertical, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown'

const LibraryDeleteModal = dynamic(() => import('./LibraryDeleteModal'))
const LibraryEditModal = dynamic(() => import('./LibraryEditModal'))

type Library = {
  id: number
  name: string
  description: string | null
  color: string | null
  icon: string | null
  itemCount: number
  isPublic: boolean
}

type Props = {
  library: Library
  className?: string
}

export default function LibraryManagementMenu({ library, className = '' }: Props) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const t = useTranslations('Library.management')

  return (
    <>
      <Dropdown>
        <DropdownTrigger aria-label={t('ariaLabel')} className={`hover:bg-zinc-800 rounded-lg transition ${className}`}>
          <MoreVertical className="size-5" />
        </DropdownTrigger>
        <DropdownContent align="end" className="w-48 opacity-100">
          <DropdownItem onClick={() => setIsEditModalOpen(true)}>
            <Edit className="size-4 mr-2" />
            {t('edit')}
          </DropdownItem>
          <DropdownItem className="text-red-400" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="size-4 mr-2" />
            {t('delete')}
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
      <LibraryEditModal library={library} onOpenChange={setIsEditModalOpen} open={isEditModalOpen} />
      <LibraryDeleteModal
        itemCount={library.itemCount}
        libraryId={library.id}
        libraryName={library.name}
        onOpenChange={setIsDeleteModalOpen}
        open={isDeleteModalOpen}
      />
    </>
  )
}
