'use client'

import type { GETV1LibraryListResponse, LibraryListItem, POSTV1LibraryResponse } from '@litomi/contracts'

import { DEFAULT_LIBRARY_COLOR, DEFAULT_LIBRARY_ICON } from '@litomi/domain/library/defaults'
import {
  MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_ICON_LENGTH, MAX_LIBRARY_NAME_LENGTH, } from '@litomi/domain/library/policy'
import { normalizeString } from '@litomi/std'
import { Dialog, DialogBody, DialogFooter, DialogHeader, Toggle } from '@litomi/ui'
import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Shuffle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import type { ProblemDetailsError } from '@/utils/fetch-response'

import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

import { getRandomLibraryColor } from './libraryColorInput'
import { getRandomLibraryIcon, preloadLibraryEmojiList, validateLibraryIcon } from './libraryIconInput'

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

export default function CreateLibraryButton({ className = '' }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(DEFAULT_LIBRARY_COLOR)
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_LIBRARY_ICON)
  const [isRandomIconPending, setIsRandomIconPending] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const queryClient = useQueryClient()
  const { guardAdultAccess, guardLogin, me } = useAdultAccessGuard()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const colorInputId = useId()
  const iconInputId = useId()
  const t = useTranslations('Library.create')
  const commonT = useTranslations('Library.common')

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
      toast.success(t('success'))
      handleClose()
    },
  })

  const isPending = createMutation.isPending

  function handleClose() {
    setIsModalOpen(false)
    setIsRandomIconPending(false)
  }

  function handleOpen() {
    setIsModalOpen(true)
    guardLogin()
  }

  function handleTogglePublic(next: boolean) {
    if (!next && !guardAdultAccess()) {
      return
    }

    setIsPublic(next)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!event.currentTarget.reportValidity()) {
      return
    }

    if (!guardLogin()) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')?.toString() ?? ''
    const description = normalizeString(formData.get('description')?.toString())
    const icon = validateLibraryIcon(selectedIcon, commonT('singleEmoji'))

    if (!icon) {
      return
    }

    createMutation.mutate({
      name,
      description,
      color: selectedColor ?? null,
      icon,
      isPublic,
    })
  }

  async function updateRandomIcon(excludedIcon?: string) {
    setIsRandomIconPending(true)

    try {
      const nextIcon = await getRandomLibraryIcon(excludedIcon)
      setSelectedIcon(nextIcon)
    } catch {
      toast.warning(t('randomIconError'))
    } finally {
      setIsRandomIconPending(false)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      nameInputRef.current?.focus()
    }
  }, [isModalOpen])

  return (
    <>
      <button
        className={twMerge(
          'flex w-full items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition',
          'sm:rounded sm:p-1.5 sm:hover:bg-zinc-800 sm:w-auto',
          className,
        )}
        onClick={handleOpen}
        onFocus={preloadLibraryEmojiList}
        onMouseEnter={preloadLibraryEmojiList}
        title={t('title')}
        type="button"
      >
        <Plus className="size-5 shrink-0" />
        <span className="font-medium sm:hidden">{t('title')}</span>
      </button>
      <Dialog ariaLabel={t('title')} onClose={handleClose} open={isModalOpen}>
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
          <DialogHeader onClose={handleClose} title={t('title')} />
          <DialogBody className="overflow-x-hidden flex flex-col gap-4 relative">
            <div className="flex items-center justify-center p-4">
              <div
                className="size-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition"
                style={{ backgroundColor: selectedColor }}
              >
                <span className="max-w-full overflow-hidden">
                  {normalizeString(selectedIcon) || DEFAULT_LIBRARY_ICON}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor={iconInputId}>
                {t('icon')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  autoCapitalize="off"
                  autoComplete="off"
                  className={twMerge(
                    'h-12 w-20 rounded-lg border-2 border-zinc-700 bg-zinc-800 text-center text-2xl outline-none transition',
                    'focus:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                  disabled={isPending}
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
                  aria-label={t('randomIcon')}
                  className={twMerge(
                    'inline-flex size-12 items-center justify-center rounded-lg border-2 border-zinc-700 bg-zinc-900',
                    'text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                  disabled={isPending || isRandomIconPending}
                  onClick={() => updateRandomIcon(selectedIcon)}
                  onFocus={preloadLibraryEmojiList}
                  onMouseEnter={preloadLibraryEmojiList}
                  title={t('randomIcon')}
                  type="button"
                >
                  {isRandomIconPending ? <Loader2 className="size-4 animate-spin" /> : <Shuffle className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor={colorInputId}>
                {t('color')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  className={twMerge(
                    'h-12 w-20 overflow-hidden rounded-lg border-2 border-zinc-700 bg-zinc-800 p-0 outline-none transition',
                    'focus:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-50',
                    '[&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:border-0',
                    '[&::-webkit-color-swatch-wrapper]:p-0',
                  )}
                  disabled={isPending}
                  id={colorInputId}
                  name="color"
                  onChange={(event) => setSelectedColor(event.currentTarget.value)}
                  type="color"
                  value={selectedColor}
                />
                <button
                  aria-label={t('randomColor')}
                  className={twMerge(
                    'inline-flex size-12 items-center justify-center rounded-lg border-2 border-zinc-700 bg-zinc-900',
                    'text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                  disabled={isPending}
                  onClick={() => setSelectedColor(getRandomLibraryColor())}
                  title={t('randomColor')}
                  type="button"
                >
                  <Shuffle className="size-4" />
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="name">
                {t('name')}
              </label>
              <input
                autoCapitalize="off"
                autoComplete="off"
                className="w-full px-3 py-2 bg-zinc-800 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 outline-none transition text-zinc-100 placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPending}
                id="name"
                maxLength={MAX_LIBRARY_NAME_LENGTH}
                name="name"
                placeholder={t('namePlaceholder')}
                ref={nameInputRef}
                required
                type="text"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="description">
                {t('description')}
              </label>
              <textarea
                className="w-full p-3 bg-zinc-800 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 outline-none transition text-zinc-100 placeholder-zinc-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPending}
                id="description"
                maxLength={MAX_LIBRARY_DESCRIPTION_LENGTH}
                name="description"
                placeholder={t('descriptionPlaceholder')}
                rows={3}
              />
            </div>

            {/* Public Toggle */}
            <div>
              <div className="block text-sm font-medium text-zinc-300 mb-2">{t('visibility')}</div>
              <label className="w-full block p-4 rounded-lg border-2 bg-zinc-900 border-zinc-700 hover:border-zinc-600 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-100">{isPublic ? t('publicTitle') : t('privateTitle')}</div>
                    <div className="text-sm text-zinc-400">
                      {isPublic ? t('publicDescription') : t('privateDescription')}
                    </div>
                  </div>
                  <Toggle
                    aria-label={t('visibilityAria')}
                    checked={isPublic}
                    className="w-12 peer-checked:bg-brand/80"
                    disabled={isPending}
                    name="is-public"
                    onToggle={handleTogglePublic}
                  />
                </div>
              </label>
            </div>
          </DialogBody>

          {/* Footer */}
          <DialogFooter className="border-t-2 border-zinc-800 flex gap-2">
            <button
              className="flex-1 px-4 py-3 text-zinc-300 font-medium bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition"
              disabled={isPending}
              onClick={handleClose}
              type="button"
            >
              {commonT('cancel')}
            </button>
            <button
              className="flex-1 px-4 py-3 text-background font-semibold bg-brand hover:bg-brand/90 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition flex items-center justify-center gap-2"
              disabled={isPending}
              type="submit"
            >
              {isPending ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <Plus className="size-5 shrink-0" />}
              <span>{t('submit')}</span>
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}

async function createLibraryApi(payload: CreateLibraryPayload): Promise<POSTV1LibraryResponse> {
  const url = '/api/v1/library'

  const { data } = await fetchAPIData<POSTV1LibraryResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return data
}
