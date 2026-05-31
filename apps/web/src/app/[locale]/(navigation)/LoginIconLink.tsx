import { LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import { usePathname } from '@/i18n/navigation'
import { SearchParamKey } from '@/storage'

import SelectableLink from './SelectableLink'

export default function LoginIconLink() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('Auth.loginButton')
  const fullPath = `${pathname}?${searchParams.toString()}`

  return (
    <SelectableLink
      className="sm:p-2"
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(fullPath)}`}
      icon={<LogIn />}
    >
      {t('action')}
    </SelectableLink>
  )
}
