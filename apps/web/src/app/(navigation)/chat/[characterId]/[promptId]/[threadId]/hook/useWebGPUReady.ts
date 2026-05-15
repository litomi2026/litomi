import { useEffect, useState } from 'react'

import { isWebGPUSupported } from '@/app/(navigation)/chat/util/gpu'

type Options = {
  enabled: boolean
}

export function useWebGPUReady({ enabled }: Options) {
  const [isWebGpuReady, setIsWebGpuReady] = useState<boolean | null>(null)

  useEffect(() => {
    if (!enabled) {
      setIsWebGpuReady(null)
      return
    }

    void (async () => {
      const supported = await isWebGPUSupported()
      setIsWebGpuReady(supported)
    })()
  }, [enabled])

  return isWebGpuReady
}
