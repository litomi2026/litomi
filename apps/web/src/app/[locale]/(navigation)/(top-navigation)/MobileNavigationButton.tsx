'use client'

import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

import MobileNavigationMenu from '@/components/MobileNavigationMenu'

import { topNavigationActionClassName } from './topNavigationActionConfig'

export default function MobileNavigationButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const t = useTranslations('TopNavigation.actions')

  const handleMenuClick = useCallback(() => {
    setIsMenuOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  return (
    <>
      <button
        aria-expanded={isMenuOpen}
        aria-haspopup="dialog"
        aria-label={t('menu')}
        className={`${topNavigationActionClassName} aria-expanded:bg-zinc-900 sm:hidden`}
        onClick={handleMenuClick}
        type="button"
      >
        <Menu className="size-5" />
      </button>
      <MobileNavigationMenu onClose={handleClose} open={isMenuOpen} />
    </>
  )
}
