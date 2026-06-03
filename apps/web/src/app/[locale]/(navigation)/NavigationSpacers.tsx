export function DesktopNavigationSpacer() {
  return <div aria-hidden className="hidden shrink-0 sm:block sm:w-20 2xl:w-3xs" />
}

export function MobileNavigationSpacer() {
  return <div aria-hidden className="w-full h-[calc(4rem+var(--safe-area-bottom))] shrink-0 sm:hidden" />
}
