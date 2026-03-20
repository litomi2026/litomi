'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import type { POSTV1PostBody, POSTV1PostResponse } from '@/backend/api/v1/post/POST'

import { MAX_POST_CONTENT_LENGTH } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { ProblemDetailsError } from '@/utils/react-query-error'

import Squircle from '../ui/Squircle'
import { createPost } from './api'
import PostGeolocationButton from './button/PostGeolocationButton'

type Props = {
  buttonText?: string
  className?: string
  placeholder?: string
  isReply?: boolean
  mangaId?: number
  parentPostId?: number
  referredPostId?: number
}

export default function PostCreationForm({
  className = '',
  placeholder,
  isReply,
  buttonText = '게시하기',
  mangaId,
  parentPostId,
  referredPostId,
}: Readonly<Props>) {
  const [content, setContent] = useState('')
  const [hasFocusedBefore, setHasFocusedBefore] = useState(false)
  const { data: me } = useMeQuery()
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation<POSTV1PostResponse, ProblemDetailsError, POSTV1PostBody>({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.postsBase })
      toast.success('글을 작성했어요')
      setContent('')
    },
  })

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!me) {
      showLoginRequiredToast()
      return
    }

    mutate({
      content,
      mangaId: mangaId ?? null,
      parentPostId: parentPostId ?? null,
      referredPostId: referredPostId ?? null,
    })
  }

  function handleClick() {
    if (!me) {
      showLoginRequiredToast()
      return
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      const form = e.currentTarget.closest('form')
      if (form) {
        form.requestSubmit()
      }
    }
  }

  return (
    <form className={twMerge('gap-3', className)} onClick={handleClick} onSubmit={handleSubmit}>
      <Squircle className="w-10 shrink-0" src={me?.imageURL} textClassName="text-foreground">
        {me?.nickname.slice(0, 2)}
      </Squircle>
      <div className="grid items-center gap-3 grow py-1.5">
        {isReply && me && hasFocusedBefore && (
          <button className="text-left">
            <span className="font-semibold text-foreground">@{me.name} </span>
            에게 보내는 답글
          </button>
        )}
        <TextareaAutosize
          className="h-7 max-h-screen w-full max-w-prose resize-none text-xl focus:outline-none disabled:pointer-events-none"
          disabled={!me || isPending}
          maxLength={MAX_POST_CONTENT_LENGTH}
          maxRows={25}
          minLength={2}
          name="content"
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setHasFocusedBefore(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required
          value={content}
        />
        {hasFocusedBefore && (
          <div className="flex justify-between gap-2">
            <div className="flex -translate-x-2 items-center text-foreground">
              <PostGeolocationButton disabled={!me} onLocationChange={() => {}} />
            </div>
            <div className="flex items-center gap-3">
              <div>{content.length}</div>
              <button
                aria-busy={isPending}
                className="whitespace-nowrap relative bg-brand text-background rounded-full px-4 py-2 font-semibold 
                disabled:text-zinc-500 disabled:bg-zinc-800 aria-busy:text-background/0"
                disabled={!me || isPending}
                type="submit"
              >
                {buttonText}
                {isPending && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-4 text-zinc-900 animate-spin" />
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
