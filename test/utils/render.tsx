import { RenderOptions, render as rtlRender } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

import QueryProvider from '@/lib/react-query/QueryProvider'

// Create a custom render function that includes all providers
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any additional options here
}

// All the providers for the app
function AllTheProviders({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>
}

// Custom render function
function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  return rtlRender(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
