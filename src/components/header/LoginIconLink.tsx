import { SearchParamKey } from '@/constants/storage'
import { usePathname } from 'next/navigation'

import IconLogin from '../icons/IconLogin'
import SelectableLink from '../SelectableLink'

export default function LoginIconLink() {
  const pathname = usePathname()

  return (
    <SelectableLink
      className="sm:py-1"
      href={`/auth/login?${SearchParamKey.REDIRECT_URL}=${encodeURIComponent(pathname)}`}
      Icon={<IconLogin />}
    >
      로그인
    </SelectableLink>
  )
}
