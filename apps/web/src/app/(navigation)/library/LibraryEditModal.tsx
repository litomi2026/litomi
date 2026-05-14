'use client'

import type {
  GETV1LibraryListResponse,
  LibraryListItem,
  PATCHV1LibraryIdBody,
} from '@litomi/contracts/api/library'

import { DEFAULT_LIBRARY_COLOR, DEFAULT_LIBRARY_ICON } from '@litomi/domain/constants/library'
import { MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_ICON_LENGTH, MAX_LIBRARY_NAME_LENGTH } from '@litomi/domain/constants/policy'
import { normalizeString } from '@litomi/std/string'
import Dialog from '@litomi/ui/dialog'
import DialogBody from '@litomi/ui/dialog-body'
import DialogFooter from '@litomi/ui/dialog-footer'
import DialogHeader from '@litomi/ui/dialog-header'
import Toggle from '@litomi/ui/toggle'
import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Shuffle } from 'lucide-react'
import { type SubmitEvent, useEffect, useId, useState } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { showAdultVerificationRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { ProblemDetailsError } from '@/utils/react-query-error'

import { updateLibrary } from './api'
import { getRandomLibraryColor } from './libraryColorInput'
import { getRandomLibraryIcon, getValidLibraryIcon, preloadLibraryEmojiList } from './libraryIconInput'

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
  const [isPublic, setIsPublic] = useState(library.isPublic)
  const [selectedColor, setSelectedColor] = useState(library.color || DEFAULT_LIBRARY_COLOR)
  const [selectedIcon, setSelectedIcon] = useState(library.icon || DEFAULT_LIBRARY_ICON)
  const [isRandomIconPending, setIsRandomIconPending] = useState(false)
  const colorInputId = useId()
  const iconInputId = useId()
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const adultState = getAdultState(me)

  const updateLibraryMutation = useMutation({
    mutationFn: ({ body, libraryId }: { libraryId: number; body: PATCHV1LibraryIdBody }) =>
      updateLibrary(libraryId, body),
    onError: (error) => {
      if (error instanceof ProblemDetailsError) {
        toast.warning(error.message || '입력을 확인해 주세요')
      }
    },
    onSuccess: ({ id: updatedLibraryId }, { body }) => {
      const nextName = body.name.trim()
      const nextDescription = normalizeString(body.description)
      const nextColor = body.color || null
      const nextIcon = body.icon || null
      const nextIsPublic = body.isPublic

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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!event.currentTarget.reportValidity()) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')?.toString().trim() ?? ''
    const description = formData.get('description')?.toString() ?? null
    const icon = getValidLibraryIcon(selectedIcon)

    if (!icon) {
      return
    }

    const body: PATCHV1LibraryIdBody = {
      name,
      description: normalizeString(description),
      color: selectedColor || null,
      icon,
      isPublic,
    }

    updateLibraryMutation.mutate({ body, libraryId: library.id })
  }

  function handleTogglePublic(next: boolean) {
    if (!next && !hasAdultAccess(adultState)) {
      showAdultVerificationRequiredToast({ username: me?.name })
      setIsPublic(true)
      return
    }

    setIsPublic(next)
  }

  async function updateRandomIcon(excludedIcon?: string) {
    setIsRandomIconPending(true)

    try {
      const nextIcon = await getRandomLibraryIcon(excludedIcon)
      setSelectedIcon(nextIcon)
    } catch {
      toast.warning('랜덤 아이콘을 불러오지 못했어요')
    } finally {
      setIsRandomIconPending(false)
    }
  }

  useEffect(() => {
    setIsRandomIconPending(false)

    if (open) {
      setIsPublic(library.isPublic)
      setSelectedColor(library.color || DEFAULT_LIBRARY_COLOR)
      setSelectedIcon(library.icon || DEFAULT_LIBRARY_ICON)
    }
  }, [library.color, library.icon, library.isPublic, open])

  return (
    <Dialog ariaLabel="서재 수정" onClose={() => onOpenChange(false)} open={open}>
      <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
        <DialogHeader onClose={() => onOpenChange(false)} title="서재 수정" />
        <DialogBody className="grid gap-4">
          <div className="flex items-center justify-center p-4">
            <div
              className="size-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition"
              style={{ backgroundColor: selectedColor }}
            >
              <span className="max-w-full overflow-hidden">{normalizeString(selectedIcon) || DEFAULT_LIBRARY_ICON}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5" htmlFor={iconInputId}>
              아이콘
            </label>
            <div className="flex items-center gap-2">
              <input
                autoCapitalize="off"
                autoComplete="off"
                className="h-10 w-16 rounded-lg border border-zinc-700 bg-zinc-800 text-center text-xl outline-none transition
                  focus:border-transparent focus:ring-2 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={updateLibraryMutation.isPending}
                id={iconInputId}
                maxLength={MAX_LIBRARY_ICON_LENGTH}
                name="icon"
                onBlur={() => setSelectedIcon(normalizeString(selectedIcon) ?? '')}
                onChange={(e) => setSelectedIcon(e.currentTarget.value)}
                placeholder={DEFAULT_LIBRARY_ICON}
                required
                spellCheck={false}
                type="text"
                value={selectedIcon}
              />
              <button
                aria-label="랜덤 아이콘으로 변경"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900
                  text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800
                  disabled:cursor-not-allowed disabled:opacity-50"
                disabled={updateLibraryMutation.isPending || isRandomIconPending}
                onClick={() => updateRandomIcon(selectedIcon)}
                onFocus={preloadLibraryEmojiList}
                onMouseEnter={preloadLibraryEmojiList}
                title="랜덤 아이콘으로 변경"
                type="button"
              >
                {isRandomIconPending ? <Loader2 className="size-4 animate-spin" /> : <Shuffle className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5" htmlFor={colorInputId}>
              색상
            </label>
            <div className="flex items-center gap-2">
              <input
                className="h-10 w-20 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 p-0 outline-none transition
                  focus:border-transparent focus:ring-2 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50
                  [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:border-0
                  [&::-webkit-color-swatch-wrapper]:p-0"
                disabled={updateLibraryMutation.isPending}
                id={colorInputId}
                name="color"
                onChange={(event) => setSelectedColor(event.currentTarget.value)}
                type="color"
                value={selectedColor}
              />
              <button
                aria-label="랜덤 색상으로 변경"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900
                  text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800
                  disabled:cursor-not-allowed disabled:opacity-50"
                disabled={updateLibraryMutation.isPending}
                onClick={() => setSelectedColor(getRandomLibraryColor())}
                title="랜덤 색상으로 변경"
                type="button"
              >
                <Shuffle className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5" htmlFor="library-name">
              이름
            </label>
            <input
              className="w-full px-3 py-2 bg-zinc-800 border rounded-lg border-zinc-700 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-zinc-600"
              defaultValue={library.name}
              disabled={updateLibraryMutation.isPending}
              id="library-name"
              maxLength={MAX_LIBRARY_NAME_LENGTH}
              minLength={1}
              name="name"
              pattern=".*\S.*"
              placeholder="서재 이름"
              required
              title="서재 이름을 입력해 주세요"
              type="text"
            />
            <p className="text-xs mt-1 text-zinc-500">{`서재 이름을 입력해주세요 (최대 ${MAX_LIBRARY_NAME_LENGTH}자)`}</p>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5" htmlFor="library-description">
              설명 (선택)
            </label>
            <textarea
              className="w-full px-3 py-2 bg-zinc-800 border rounded-lg border-zinc-700 focus:outline-none focus:ring-2 focus:border-transparent focus:ring-zinc-600 resize-none"
              defaultValue={library.description || ''}
              disabled={updateLibraryMutation.isPending}
              id="library-description"
              maxLength={MAX_LIBRARY_DESCRIPTION_LENGTH}
              name="description"
              placeholder="서재 설명"
              rows={3}
            />
            <p className="text-xs text-zinc-500">{`서재에 대한 설명을 추가할 수 있어요 (최대 ${MAX_LIBRARY_DESCRIPTION_LENGTH}자)`}</p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <div className="text-sm text-zinc-100">공개 설정</div>
              <div className="text-xs text-zinc-500 mt-0.5">다른 사용자가 이 서재를 볼 수 있어요</div>
            </div>
            <Toggle
              aria-label="서재 공개 설정"
              checked={isPublic}
              className="w-12 peer-checked:bg-brand/80"
              disabled={updateLibraryMutation.isPending}
              name="is-public"
              onToggle={handleTogglePublic}
            />
          </div>
        </DialogBody>
        <DialogFooter className="flex gap-3">
          <button
            className="flex-1 h-10 px-4 rounded-lg bg-zinc-800 text-zinc-300 font-medium 
              hover:bg-zinc-700 transition disabled:opacity-50"
            disabled={updateLibraryMutation.isPending}
            onClick={() => onOpenChange(false)}
            type="button"
          >
            취소
          </button>
          <button
            className="flex-1 h-10 px-4 rounded-lg bg-brand text-background font-semibold
              hover:bg-brand/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={updateLibraryMutation.isPending}
            type="submit"
          >
            {updateLibraryMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            <span>수정하기</span>
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
