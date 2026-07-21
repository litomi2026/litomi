import SeasonalEffects from '@/components/seasonal/SeasonalEffects'
import { getLocaleFromParams } from '@/i18n/server'

import BottomNavigation from './BottomNavigation'
import DesktopSidebar from './DesktopSidebar'
import { DesktopNavigationSpacer } from './NavigationSpacers'

export default async function Layout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocaleFromParams(params)

  return (
    <div className="flex flex-col min-h-full mx-auto px-safe max-w-screen-2xl sm:flex-row">
      <SeasonalEffects />
      <DesktopSidebar locale={locale} />
      <BottomNavigation />
      <DesktopNavigationSpacer />
      {children}
    </div>
  )
}
