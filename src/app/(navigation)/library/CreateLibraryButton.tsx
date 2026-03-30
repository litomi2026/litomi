'use client'

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { GETV1LibraryListResponse, LibraryListItem } from '@/backend/api/v1/library/GET'
import type { POSTV1LibraryResponse } from '@/backend/api/v1/library/POST'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'
import Toggle from '@/components/ui/Toggle'
import { MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_NAME_LENGTH } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { showAdultVerificationRequiredToast, showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { fetchWithErrorHandling, type ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
]

const DEFAULT_ICONS = ['📚', '❤️', '⭐', '📖', '🔖', '📌', '💾', '🗂️']

type CreateLibraryPayload = {
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isPublic: boolean
}

type Props = {
  className?: string
}

export default function CreateLibraryButton({ className = '' }: Readonly<Props>) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICONS[0])
  const [isPublic, setIsPublic] = useState(true)
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const adultState = getAdultState(me)

  const createMutation = useMutation<POSTV1LibraryResponse, ProblemDetailsError, CreateLibraryPayload>({
    mutationFn: createLibraryApi,
    onSuccess: ({ id: newLibraryId, createdAt }, variables) => {
      const meId = me?.id
      if (!meId) {
        return
      }

      queryClient.setQueryData<LibraryListItem[]>(QueryKeys.libraries, (oldLibraries) => {
        const newLibrary: LibraryListItem = {
          id: newLibraryId,
          userId: meId,
          name: variables.name,
          description: variables.description,
          color: variables.color,
          icon: variables.icon,
          isPublic: variables.isPublic,
          createdAt,
          itemCount: 0,
        }

        return oldLibraries ? [...oldLibraries.filter((lib) => lib.id !== newLibrary.id), newLibrary] : [newLibrary]
      })

      queryClient.setQueryData<InfiniteData<GETV1LibraryListResponse, string | null>>(
        QueryKeys.infiniteLibraryList(meId),
        (oldData) => {
          if (!oldData) {
            return oldData
          }

          const newItem = {
            id: newLibraryId,
            userId: meId,
            name: variables.name,
            description: variables.description,
            color: variables.color,
            icon: variables.icon,
            isPublic: variables.isPublic,
            itemCount: 0,
            createdAt,
          }

          const [firstPage, ...restPages] = oldData.pages
          if (!firstPage) {
            return oldData
          }

          const nextFirstPage = {
            ...firstPage,
            libraries: [newItem, ...firstPage.libraries.filter((lib) => lib.id !== newItem.id)],
          }

          return { ...oldData, pages: [nextFirstPage, ...restPages] }
        },
      )

      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      toast.success('서재를 생성했어요')
      handleClose()
    },
  })

  const isPending = createMutation.isPending

  function handleClose() {
    setIsModalOpen(false)
    setSelectedColor(DEFAULT_COLORS[0])
    setSelectedIcon(DEFAULT_ICONS[0])
  }

  function handleOpen() {
    setIsModalOpen(true)

    if (!me?.id) {
      showLoginRequiredToast()
    }
  }

  function handleTogglePublic(next: boolean) {
    if (!next && !hasAdultAccess(adultState)) {
      showAdultVerificationRequiredToast({ username: me?.name })
      return
    }

    setIsPublic(next)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!event.currentTarget.reportValidity()) {
      return
    }

    if (!me?.id) {
      showLoginRequiredToast()
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')?.toString() ?? ''
    const description = (formData.get('description')?.toString() ?? '').trim() || null

    createMutation.mutate({
      name,
      description,
      color: selectedColor ?? null,
      icon: selectedIcon ?? null,
      isPublic,
    })
  }

  useEffect(() => {
    if (isModalOpen) {
      nameInputRef.current?.focus()
    }
  }, [isModalOpen])

  return (
    <>
      <button
        className={`flex w-full items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition
          sm:rounded sm:p-1.5 sm:hover:bg-zinc-800 sm:w-auto ${className}`}
        onClick={handleOpen}
        title="서재 만들기"
        type="button"
      >
        <Plus className="size-5 shrink-0" />
        <span className="font-medium sm:hidden">서재 만들기</span>
      </button>
      <Dialog ariaLabel="서재 만들기" onClose={handleClose} open={isModalOpen}>
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
          <DialogHeader onClose={handleClose} title="서재 만들기" />
          <DialogBody className="overflow-x-hidden flex flex-col gap-4 relative">
            <div className="flex items-center justify-center p-4">
              <div
                className="size-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition"
                style={{ backgroundColor: selectedColor }}
              >
                {selectedIcon}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">아이콘</label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_ICONS.map((icon) => (
                  <button
                    aria-pressed={selectedIcon === icon}
                    className="p-3 rounded-lg border-2 text-2xl transition flex items-center justify-center
                      aria-pressed:bg-zinc-700 aria-pressed:border-brand aria-pressed:hover:bg-zinc-700
                      border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
                    disabled={isPending}
                    key={icon}
                    onClick={() => setSelectedIcon(icon)}
                    type="button"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">색상</label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    aria-pressed={selectedColor === color}
                    className="h-12 rounded-lg border-2 border-background transition aria-pressed:ring-2 aria-pressed:ring-brand
                      disabled:opacity-50"
                    disabled={isPending}
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="name">
                서재 이름
              </label>
              <input
                autoCapitalize="off"
                autoComplete="off"
                className="w-full px-3 py-2 bg-zinc-800 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 outline-none transition text-zinc-100 placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPending}
                id="name"
                maxLength={MAX_LIBRARY_NAME_LENGTH}
                name="name"
                placeholder="순애작"
                ref={nameInputRef}
                required
                type="text"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="description">
                설명 (선택사항)
              </label>
              <textarea
                className="w-full p-3 bg-zinc-800 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 outline-none transition text-zinc-100 placeholder-zinc-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPending}
                id="description"
                maxLength={MAX_LIBRARY_DESCRIPTION_LENGTH}
                name="description"
                placeholder="달달한 순애만"
                rows={3}
              />
            </div>

            {/* Public Toggle */}
            <div>
              <div className="block text-sm font-medium text-zinc-300 mb-2">공개 설정</div>
              <label className="w-full block p-4 rounded-lg border-2 bg-zinc-900 border-zinc-700 hover:border-zinc-600 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-100">{isPublic ? '공개 서재' : '비공개 서재'}</div>
                    <div className="text-sm text-zinc-400">
                      {isPublic ? '다른 사용자들이 이 서재를 볼 수 있어요' : '나만 볼 수 있는 서재예요'}
                    </div>
                  </div>
                  <Toggle
                    aria-label="서재 공개 설정"
                    checked={isPublic}
                    className="w-12 peer-checked:bg-brand/80"
                    disabled={isPending}
                    name="is-public"
                    onToggle={handleTogglePublic}
                  />
                </div>
              </label>
            </div>

            {/* Hidden inputs */}
            <input name="color" type="hidden" value={selectedColor} />
            <input name="icon" type="hidden" value={selectedIcon} />
          </DialogBody>

          {/* Footer */}
          <DialogFooter className="border-t-2 border-zinc-800 flex gap-2">
            <button
              className="flex-1 px-4 py-3 text-zinc-300 font-medium bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition"
              disabled={isPending}
              onClick={handleClose}
              type="button"
            >
              취소
            </button>
            <button
              className="flex-1 px-4 py-3 text-background font-semibold bg-brand hover:bg-brand/90 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition flex items-center justify-center gap-2"
              disabled={isPending}
              type="submit"
            >
              {isPending ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <Plus className="size-5 shrink-0" />}
              <span>생성하기</span>
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}

async function createLibraryApi(payload: CreateLibraryPayload): Promise<POSTV1LibraryResponse> {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library`
  const { data } = await fetchWithErrorHandling<POSTV1LibraryResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return data
}
