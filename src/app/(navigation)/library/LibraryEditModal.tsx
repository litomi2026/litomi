'use client'

import { type InfiniteData, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2 } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

import type { GETV1LibraryListResponse, LibraryListItem } from '@/backend/api/v1/library/GET'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'
import Toggle from '@/components/ui/Toggle'
import { MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_NAME_LENGTH } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import useServerAction, { getFieldError, getFormField } from '@/hook/useServerAction'
import { showAdultVerificationRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'

import { updateLibrary } from './action-library'

const DEFAULT_ICONS = ['📚', '❤️', '⭐', '📖', '🔖', '📌', '💾', '🗂️']

type Library = {
  id: number
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isPublic: boolean
}

type Props = {
  library: Library
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LibraryEditModal({ library, open, onOpenChange }: Readonly<Props>) {
  const formRef = useRef<HTMLFormElement>(null)
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const canAccess = canAccessAdultRestrictedAPIs(me)

  const [response, dispatchAction, isPending] = useServerAction({
    action: updateLibrary,
    onError: ({ error }) => {
      if (typeof error !== 'string') {
        toast.error(error.libraryId || error.name || error.description || error.color || error.icon)
      }
    },
    onSuccess: (updatedLibraryId, [formData]) => {
      const nextName = (formData.get('name')?.toString() ?? '').trim()
      const nextDescription = (formData.get('description')?.toString() ?? '').trim() || null
      const nextColor = formData.get('color')?.toString() ?? null
      const nextIcon = formData.get('icon')?.toString() ?? null
      const nextIsPublic = formData.get('is-public')?.toString() === 'on'

      queryClient.setQueryData<LibraryListItem[]>(QueryKeys.libraries, (oldLibraries) => {
        return oldLibraries?.map((lib) =>
          lib.id === updatedLibraryId
            ? {
                ...lib,
                name: nextName || lib.name,
                description: nextDescription,
                color: nextColor,
                icon: nextIcon,
                isPublic: nextIsPublic,
              }
            : lib,
        )
      })

      queryClient.setQueriesData<InfiniteData<GETV1LibraryListResponse, string | null>>(
        { queryKey: QueryKeys.infiniteLibraryListBase },
        (oldData) => {
          if (!oldData) {
            return oldData
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              libraries: page.libraries.map((lib) =>
                lib.id === updatedLibraryId
                  ? {
                      ...lib,
                      name: nextName || lib.name,
                      description: nextDescription,
                      color: nextColor,
                      icon: nextIcon,
                      isPublic: nextIsPublic,
                    }
                  : lib,
              ),
            })),
          }
        },
      )

      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })

      toast.success('서재가 수정됐어요')
      onOpenChange(false)
    },
  })

  const nameError = getFieldError(response, 'name')
  const descriptionError = getFieldError(response, 'description')
  const nameValue = getFormField(response, 'name') || library.name
  const descriptionValue = getFormField(response, 'description') || library.description || ''
  const colorValue = getFormField(response, 'color') || library.color || '#6366f1'
  const iconValue = getFormField(response, 'icon') || library.icon || '📚'
  const isPublic = getFormField(response, 'is-public') === 'on' || library.isPublic

  function handleIconClick(emoji: string) {
    if (!formRef.current) {
      return
    }

    formRef.current.icon.value = emoji
    const buttons = formRef.current.querySelectorAll('[name="icon-button"]')

    for (const button of buttons) {
      const buttonElement = button as HTMLButtonElement
      buttonElement.setAttribute('aria-pressed', buttonElement.dataset.icon === emoji ? 'true' : 'false')
    }
  }

  function handleTogglePublic(next: boolean) {
    if (next === false && !canAccess) {
      showAdultVerificationRequiredToast({ username: me?.name })
      const input = formRef.current?.querySelector<HTMLInputElement>('input[name="is-public"]')
      
      if (input) {
        input.checked = true
      }
    }
  }

  return (
    <Dialog ariaLabel="서재 수정" onClose={() => onOpenChange(false)} open={open}>
      <form action={dispatchAction} className="flex flex-1 flex-col min-h-0" ref={formRef}>
        <input name="library-id" type="hidden" value={library.id} />
        <DialogHeader onClose={() => onOpenChange(false)} title="서재 수정" />
        <DialogBody className="grid gap-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5" htmlFor="library-name">
              이름
            </label>
            <input
              aria-invalid={Boolean(nameError)}
              className="w-full px-3 py-2 bg-zinc-800 border rounded-lg 
              focus:outline-none focus:ring-2 focus:border-transparent
              aria-invalid:border-red-500 aria-invalid:focus:ring-red-500
              border-zinc-700 focus:ring-zinc-600"
              defaultValue={nameValue}
              disabled={isPending}
              id="library-name"
              maxLength={MAX_LIBRARY_NAME_LENGTH}
              name="name"
              placeholder="서재 이름"
              required
              type="text"
            />
            <p aria-invalid={Boolean(nameError)} className="text-xs mt-1 text-zinc-500 aria-invalid:text-red-400">
              {nameError || `서재 이름을 입력해주세요 (최대 ${MAX_LIBRARY_NAME_LENGTH}자)`}
            </p>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5" htmlFor="library-description">
              설명 (선택)
            </label>
            <textarea
              aria-invalid={Boolean(descriptionError)}
              className="w-full px-3 py-2 bg-zinc-800 border rounded-lg 
              focus:outline-none focus:ring-2 focus:border-transparent
              resize-none aria-invalid:border-red-500 aria-invalid:focus:ring-red-500
              border-zinc-700 focus:ring-zinc-600"
              defaultValue={descriptionValue}
              disabled={isPending}
              id="library-description"
              maxLength={MAX_LIBRARY_DESCRIPTION_LENGTH + 1}
              name="description"
              placeholder="서재 설명"
              rows={3}
            />
            <p
              aria-invalid={Boolean(descriptionError)}
              className="text-xs mt-1 text-zinc-500 aria-invalid:text-red-400"
            >
              {descriptionError || `서재에 대한 설명을 추가할 수 있어요 (최대 ${MAX_LIBRARY_DESCRIPTION_LENGTH}자)`}
            </p>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5" htmlFor="library-color">
              색상
            </label>
            <input
              className="h-10 w-20 p-1 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
              defaultValue={colorValue}
              disabled={isPending}
              id="library-color"
              name="color"
              type="color"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">아이콘</label>
            <input defaultValue={iconValue} name="icon" type="hidden" />
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {DEFAULT_ICONS.map((emoji) => (
                <button
                  aria-pressed={emoji === iconValue}
                  className="p-1 rounded-lg flex items-center justify-center text-lg transition aria-pressed:bg-zinc-700 aria-pressed:ring-2 aria-pressed:ring-zinc-500 bg-zinc-800 hover:bg-zinc-700"
                  data-icon={emoji}
                  disabled={isPending}
                  key={emoji}
                  name="icon-button"
                  onClick={() => handleIconClick(emoji)}
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between mt-2">
            <div>
              <div className="text-sm text-zinc-100">공개 설정</div>
              <div className="text-xs text-zinc-500 mt-0.5">다른 사용자가 이 서재를 볼 수 있어요</div>
            </div>
            <Toggle
              aria-label="서재 공개 설정"
              className="w-12 peer-checked:bg-brand/80"
              defaultChecked={isPublic}
              disabled={isPending}
              name="is-public"
              onToggle={handleTogglePublic}
            />
          </div>
        </DialogBody>
        <DialogFooter className="flex gap-3">
          <button
            className="flex-1 h-10 px-4 rounded-lg bg-zinc-800 text-zinc-300 font-medium 
              hover:bg-zinc-700 transition disabled:opacity-50"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            type="button"
          >
            취소
          </button>
          <button
            className="flex-1 h-10 px-4 rounded-lg bg-brand text-background font-semibold
              hover:bg-brand/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={isPending}
            type="submit"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            <span>수정하기</span>
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
