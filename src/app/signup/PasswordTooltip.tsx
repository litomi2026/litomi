'use client'

import IconInfo from '@/components/icons/IconInfo'
import { useState } from 'react'

export default function PasswordTooltip() {
  const [isActive, setIsActive] = useState(false)

  return (
    <button
      className="group relative focus:outline-none"
      onBlur={() => setIsActive(false)}
      onClick={() => setIsActive((prev) => !prev)}
      onFocus={() => setIsActive(true)}
      type="button"
    >
      <IconInfo className="w-4 md:w-5" />
      <div
        aria-current={isActive}
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full z-50 p-2
          transition duration-300 opacity-0 aria-current:opacity-100 aria-current:pointer-events-auto group-hover:opacity-100"
        role="tooltip"
      >
        <div className="rounded-xl border-2 border-zinc-700 bg-background p-2 whitespace-nowrap text-sm">
          <p>
            영문, 숫자를 포함한 8자 이상의 <br />
            비밀번호를 입력해주세요.
          </p>
        </div>
      </div>
    </button>
  )
}
