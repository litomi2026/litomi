'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { toast } from 'sonner'

import { createPost } from '@/app/(navigation)/(right-search)/posts/action'
import { PostFilter } from '@/backend/api/v1/post'
import { MAX_POST_CONTENT_LENGTH } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import useActionResponse, { getFormField } from '@/hook/useActionResponse'
import useMeQuery from '@/query/useMeQuery'

import IconSpinner from '../icons/IconSpinner'
import LoginPageLink from '../LoginPageLink'
import Squircle from '../ui/Squircle'
import PostGeolocationButton from './button/PostGeolocationButton'

type Props = {
  buttonText?: string
  className?: string
  placeholder?: string
  isReply?: boolean
  filter: PostFilter
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
  filter,
  referredPostId,
}: Readonly<Props>) {
  const [content, setContent] = useState('')
  const [hasFocusedBefore, setHasFocusedBefore] = useState(false)
  const { data: me } = useMeQuery()
  const queryClient = useQueryClient()

  const [response, dispatchAction, isPending] = useActionResponse({
    action: createPost,
    onError: ({ error }) => {
      if (typeof error !== 'string') {
        toast.error(error.content || error.mangaId || error.parentPostId || error.referredPostId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.posts(filter, mangaId) })
      toast.success('글을 작성했어요')
      setContent('')
    },
  })

  const defaultContent = getFormField(response, 'content')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!me) {
      e.preventDefault()
      toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인이 필요해요</div>
          <LoginPageLink>로그인하기</LoginPageLink>
        </div>,
      )
      return
    }

    if (content.length < 2) {
      e.preventDefault()
      toast.warning('내용을 2자 이상 입력해주세요')
      return
    }

    if (content.length > MAX_POST_CONTENT_LENGTH) {
      e.preventDefault()
      toast.warning(`내용은 ${MAX_POST_CONTENT_LENGTH}자 이하로 입력해주세요`)
      return
    }
  }

  function handleClick() {
    if (!me) {
      toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인이 필요해요</div>
          <LoginPageLink>로그인하기</LoginPageLink>
        </div>,
      )
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
    <form action={dispatchAction} className={`gap-3 ${className}`} onClick={handleClick} onSubmit={handleSubmit}>
      {mangaId && <input name="manga-id" type="hidden" value={mangaId} />}
      {parentPostId && <input name="parent-post-id" type="hidden" value={parentPostId} />}
      {referredPostId && <input name="referred-post-id" type="hidden" value={referredPostId} />}
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
          aria-disabled={!me}
          className="h-7 max-h-screen w-full max-w-prose resize-none text-xl focus:outline-none aria-disabled:pointer-events-none"
          defaultValue={defaultContent}
          maxLength={160}
          maxRows={25}
          minLength={2}
          name="content"
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setHasFocusedBefore(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required
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
                disabled={!me || isPending || content.length < 2 || content.length > 160}
                type="submit"
              >
                {buttonText}
                {isPending && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconSpinner className="w-4 text-zinc-900" />
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
