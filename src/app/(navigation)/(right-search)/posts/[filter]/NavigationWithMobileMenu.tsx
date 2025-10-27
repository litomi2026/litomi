'use client'

import { ReactNode, useCallback, useState } from 'react'

import MobileNavigationMenu from '@/components/MobileNavigationMenu'
import TopNavigation from '@/components/TopNavigation'

type Props = {
  children: ReactNode
  className?: string
}

export default function NavigationWithMobileMenu({ children, className }: Readonly<Props>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuClick = useCallback(() => {
    setIsMenuOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  return (
    <>
      <TopNavigation className={className} onMenuClick={handleMenuClick}>
        {children}
      </TopNavigation>
      {isMenuOpen && <MobileNavigationMenu onClose={handleClose} />}
    </>
  )
}
