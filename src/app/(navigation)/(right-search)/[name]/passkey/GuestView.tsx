import Link from 'next/link'

import IconShield from '@/components/icons/IconShield'
import { SearchParamKey } from '@/constants/storage'

export default function GuestView() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      {/* Elegant icon */}
      <div className="mb-8 h-24 w-24 rounded-3xl bg-gradient-to-br from-brand-end/20 to-brand-end/5 flex items-center justify-center">
        <IconShield className="h-12 w-12 text-brand-end" />
      </div>

      {/* Simplified messaging */}
      <h2 className="text-2xl sm:text-3xl font-bold mb-3">로그인이 필요해요</h2>
      <p className="text-base text-zinc-400 max-w-sm mb-8">패스키를 관리하려면 먼저 로그인해주세요</p>

      {/* Primary action */}
      <Link
        className="rounded-full bg-brand-end px-8 py-3 text-sm font-medium text-zinc-900 transition-all hover:shadow-lg hover:shadow-brand-end/25"
        href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent('/@/passkey')}`}
      >
        로그인하기
      </Link>
    </div>
  )
}
