export function MobileNavigationSpacer() {
  return (
    <div aria-hidden className="w-full h-[calc(4rem+var(--safe-area-bottom))] shrink-0 sm:hidden" />
  )
}

export function SearchHeaderSpacer() {
  return <div aria-hidden className="h-[calc(100px+var(--safe-area-top))] shrink-0 sm:h-[100px] md:h-[56px]" />
}
