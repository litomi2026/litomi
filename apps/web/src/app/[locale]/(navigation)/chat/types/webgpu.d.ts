export {}

declare global {
  interface GPU {
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>
  }

  interface GPUAdapter {
    features: GPUSupportedFeatures
    info: GPUAdapterInfo
    requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>
  }

  interface GPUAdapterInfo {
    isFallbackAdapter: boolean
  }

  interface GPUDevice {
    destroy(): void
  }

  interface GPUDeviceDescriptor {
    requiredFeatures?: readonly string[]
  }

  type GPUPowerPreference = 'high-performance' | 'low-power'

  interface GPURequestAdapterOptions {
    powerPreference?: GPUPowerPreference
  }

  interface GPUSupportedFeatures {
    has(featureName: string): boolean
  }

  interface Navigator {
    gpu: GPU
  }
}
