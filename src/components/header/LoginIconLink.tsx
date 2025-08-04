import { usePathname, useSearchParams } from 'next/navigation'

import { SearchParamKey } from '@/constants/storage'

import IconLogin from '../icons/IconLogin'
import SelectableLink from '../SelectableLink'

export default function LoginIconLink() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fullPath = `${pathname}?${searchParams.toString()}`

  return (
    <SelectableLink
      className="sm:py-1"
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(fullPath)}`}
      Icon={IconLogin}
    >
      로그인
    </SelectableLink>
  )
}
