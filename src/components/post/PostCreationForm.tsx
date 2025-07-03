'use client'

import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { toast } from 'sonner'

import useMeQuery from '@/query/useMeQuery'

import LoginLink from '../LoginLink'
import Squircle from '../ui/Squircle'
import PostGeolocationButton from './button/PostGeolocationButton'

type Props = {
  className?: string
  placeholder?: string
  buttonText?: string
  isReply?: boolean
}

export default function PostCreationForm({ className = '', placeholder, isReply, buttonText = '게시하기' }: Props) {
  const [content, setContent] = useState('')
  const [hasFocusedBefore, setHasFocusedBefore] = useState(false)

  const { data: me } = useMeQuery()

  const handleClick = () => {
    if (!me) {
      toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인이 필요해요.</div>
          <LoginLink>로그인하기</LoginLink>
        </div>,
      )
      return
    }
  }

  return (
    <form className={`gap-2 ${className}`} onClick={handleClick} onSubmit={(e) => e.preventDefault()}>
      <Squircle className="w-10 flex-shrink-0" src={me?.imageURL} textClassName="text-foreground">
        {me?.nickname.slice(0, 2)}
      </Squircle>
      <div className="grid items-center gap-3 grow py-1.5">
        {isReply && me && hasFocusedBefore && (
          <button className="text-left">
            <span className="font-semibold text-foreground">@{me.loginId} </span>
            에게 보내는 답글
          </button>
        )}
        <TextareaAutosize
          aria-disabled={!me}
          className="h-7 max-h-screen w-full max-w-prose resize-none text-xl focus:outline-none aria-disabled:pointer-events-none"
          maxRows={25}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setHasFocusedBefore(true)}
          placeholder={placeholder}
          required
          value={content}
        />
        {hasFocusedBefore && (
          <div className="flex justify-between gap-2">
            <div className="flex -translate-x-2 items-center text-foreground">
              <PostGeolocationButton disabled={!me} onLocationChange={(geolocation) => console.log(geolocation)} />
            </div>
            <div className="flex items-center gap-3">
              <div>{content.length}</div>
              <button
                className="whitespace-nowrap bg-zinc-600 rounded-full px-4 py-2 text-foreground disabled:text-zinc-500 disabled:bg-zinc-800"
                disabled={!me}
                type="submit"
              >
                {buttonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}

export function PostCreationFormSkeleton({ className = '' }: { className?: string }) {
  return <div className={`h-10 rounded-xl animate-fade-in bg-zinc-800 border-b-2 ${className}`} />
}
