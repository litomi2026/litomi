import { SessionStorageKey } from '@/constants/storage'
import { usePathname } from 'next/navigation'

import IconLogin from '../icons/IconLogin'
import SelectableLink from '../SelectableLink'

export default function LoginLink() {
  const pathname = usePathname()

  return (
    <SelectableLink
      className="sm:py-1"
      href="/auth/login"
      Icon={<IconLogin />}
      onClick={() => sessionStorage.setItem(SessionStorageKey.LOGIN_REDIRECTION, pathname)}
    >
      로그인
    </SelectableLink>
  )
}
