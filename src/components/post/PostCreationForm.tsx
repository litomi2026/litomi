'use client'

import useMeQuery from '@/query/useMeQuery'
import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

import Squircle from '../ui/Squircle'
import PostGeolocationButton from './button/PostGeolocationButton'

type Props = {
  className?: string
  placeholder?: string
  buttonText?: string
}

export default function PostCreationForm({ className = '', placeholder, buttonText = '게시하기' }: Props) {
  const [content, setContent] = useState('')
  const [hasFocusedBefore, setHasFocusedBefore] = useState(false)

  const { data: me } = useMeQuery()

  return (
    <form className={`grid grid-cols-[auto_1fr] gap-2 ${className}`} onSubmit={(e) => e.preventDefault()}>
      <Squircle className="w-10 flex-shrink-0" src={me?.imageURL} textClassName="text-white">
        {me?.nickname.slice(0, 2)}
      </Squircle>
      <div className="grid items-center gap-3">
        {hasFocusedBefore && me && (
          <button className="text-left">
            <span className="font-semibold text-white">@{me.loginId} </span>
            에게 보내는 답글
          </button>
        )}
        <TextareaAutosize
          className="h-7 max-h-screen w-full max-w-prose resize-none text-xl focus:outline-none"
          disabled={!me}
          maxRows={25}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setHasFocusedBefore(true)}
          onKeyDown={(e) => {
            console.log(e.key)
          }}
          placeholder={placeholder}
          required
          value={content}
        />
        {hasFocusedBefore && (
          <div className="flex justify-between gap-2">
            <div className="flex -translate-x-2 items-center text-white">
              <PostGeolocationButton disabled={!me} onLocationChange={(geolocation) => console.log(geolocation)} />
            </div>
            <div className="flex items-center gap-3">
              <div>{content.length}</div>
              <button
                className="whitespace-nowrap bg-zinc-600 rounded-full px-4 py-2 text-white disabled:text-zinc-500 disabled:bg-zinc-800"
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

export function PostCreationFormSkeleton() {
  return <div className="h-25 animate-fade-in duration-1000 bg-zinc-700 border-b-2" />
}
