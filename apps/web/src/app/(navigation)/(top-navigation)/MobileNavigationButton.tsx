'use client'

import { Menu } from 'lucide-react'
import { useCallback, useState } from 'react'

import MobileNavigationMenu from '@/components/MobileNavigationMenu'

import { topNavigationActionClassName } from './topNavigationActionConfig'

export default function MobileNavigationButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuClick = useCallback(() => {
    setIsMenuOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  return (
    <>
      <button
        aria-label="메뉴 열기"
        className={`${topNavigationActionClassName} sm:hidden`}
        onClick={handleMenuClick}
        type="button"
      >
        <Menu className="size-5" />
      </button>
      {isMenuOpen && <MobileNavigationMenu onClose={handleClose} />}
    </>
  )
}
