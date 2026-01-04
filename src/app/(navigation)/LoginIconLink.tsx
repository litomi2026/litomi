import { LogIn } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'

import { SearchParamKey } from '@/constants/storage'

import SelectableLink from './SelectableLink'

export default function LoginIconLink() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fullPath = `${pathname}?${searchParams.toString()}`

  return (
    <SelectableLink
      className="sm:py-1"
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(fullPath)}`}
      icon={<LogIn />}
    >
      로그인
    </SelectableLink>
  )
}
