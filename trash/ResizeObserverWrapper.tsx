import { ComponentPropsWithoutRef, ComponentRef, ElementType, ReactNode, RefObject, useEffect, useRef } from 'react'

type ResizeObserverWrapperProps<C extends ElementType> = Omit<ComponentPropsWithoutRef<C>, 'onResize'> & {
  onResize: (element: ComponentRef<C>) => void
  children: ReactNode
  as?: C
}

export default function ResizeObserverWrapper<C extends ElementType = 'div'>({
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
    observer.observe(element as unknown as Element)
    return () => observer.disconnect()
  }, [onResize])

  return (
    <Component ref={internalRef as RefObject<HTMLDivElement>} {...rest}>
      {children}
    </Component>
  )
}
