'use client'

import { Menu } from 'lucide-react'
import { useCallback, useState } from 'react'

import MobileNavigationMenu from '@/components/MobileNavigationMenu'

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
        className="sm:hidden p-2 px-3 rounded-xl transition border-2 text-foreground hover:bg-zinc-900"
        onClick={handleMenuClick}
        type="button"
      >
        <Menu className="size-5" />
      </button>
      {isMenuOpen && <MobileNavigationMenu onClose={handleClose} />}
    </>
  )
}
