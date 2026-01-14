import { useEffect, useState } from 'react'

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
      const supported = await isWebGpuSupported()
      setIsWebGpuReady(supported)
    })()
  }, [enabled])

  return isWebGpuReady
}

async function isWebGpuSupported(): Promise<boolean> {
  try {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
    if (!adapter) {
      return false
    }

    const requiredFeatures: string[] = []
    if (adapter.features.has('shader-f16')) {
      requiredFeatures.push('shader-f16')
    }

    const device = await adapter.requestDevice({ requiredFeatures })
    device.destroy()

    return true
  } catch {
    return false
  }
}
