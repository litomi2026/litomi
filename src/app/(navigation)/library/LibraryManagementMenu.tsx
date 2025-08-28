'use client'

import { Edit, MoreVertical, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'
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
}

type Props = {
  library: Library
  className?: string
}

export default function LibraryManagementMenu({ library, className = '' }: Readonly<Props>) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  return (
    <>
      <Dropdown>
        <DropdownTrigger aria-label="서재 관리" className={`p-2 hover:bg-zinc-800 rounded-lg transition ${className}`}>
          <MoreVertical className="size-5" />
        </DropdownTrigger>
        <DropdownContent align="end" className="w-48 opacity-100">
          <DropdownItem onClick={() => setIsEditModalOpen(true)}>
            <Edit className="size-4 mr-2" />
            서재 수정
          </DropdownItem>
          <DropdownItem className="text-red-400" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="size-4 mr-2" />
            서재 삭제
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
