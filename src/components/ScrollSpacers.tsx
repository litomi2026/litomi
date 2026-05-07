export function MobileNavigationSpacer() {
  return <div aria-hidden className="w-full h-[calc(4rem+var(--safe-area-bottom))] shrink-0 sm:hidden" />
}

export function SearchHeaderSpacer() {
  return (
    <div aria-hidden className="h-[calc(100px+var(--safe-area-top))] shrink-0 md:h-[calc(56px+var(--safe-area-top))]" />
  )
}
