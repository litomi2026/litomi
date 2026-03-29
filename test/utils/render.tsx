import '@test/setup.dom'
import { RenderOptions, render as rtlRender } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

import QueryProvider from '@/lib/react-query/QueryProvider'

// 모든 provider를 포함한 커스텀 render 함수를 만든다.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // 필요한 테스트 옵션이 생기면 여기에 추가한다.
}

// 앱에서 공통으로 필요한 provider를 한곳에 모은다.
function AllTheProviders({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>
}

// 공통 provider를 적용한 render 래퍼다.
function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  return rtlRender(ui, { wrapper: AllTheProviders, ...options })
}

// 테스트 편의를 위해 RTL 유틸을 다시 export한다.
export * from '@testing-library/react'
export { customRender as render }
