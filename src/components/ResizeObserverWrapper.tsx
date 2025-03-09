import { ComponentRef, useEffect, useRef } from 'react'

// 기본 DOM 요소의 props에서 onResize를 제거하여 충돌을 방지합니다.
type ResizeObserverWrapperProps<C extends React.ElementType> = Omit<React.ComponentPropsWithoutRef<C>, 'onResize'> & {
  onResize: (element: ComponentRef<C>) => void
  children: React.ReactNode
  as?: C
}

export default function ResizeObserverWrapper<C extends React.ElementType = 'div'>({
  onResize,
  children,
  as,
  ...rest
}: ResizeObserverWrapperProps<C>) {
  const Component = as || 'div'
  const internalRef = useRef<ComponentRef<C>>(null)

  useEffect(() => {
    const element = internalRef.current
    if (!element) return

    const observer = new ResizeObserver(() => {
      if (element) onResize(element)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [onResize])

  return (
    <Component ref={internalRef} {...rest}>
      {children}
    </Component>
  )
}
