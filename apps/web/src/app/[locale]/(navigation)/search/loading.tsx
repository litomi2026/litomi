import { Loader2 } from 'lucide-react'

import { MobileNavigationSpacer, SearchHeaderSpacer } from '@/components/ScrollSpacers'

export default function Loading() {
  return (
    <>
      <SearchHeaderSpacer />
      <div className="flex justify-center items-center flex-1 animate-fade-in [animation-delay:0.5s] [animation-fill-mode:both]">
        <Loader2 className="size-8 animate-spin" />
      </div>
      <MobileNavigationSpacer />
    </>
  )
}
