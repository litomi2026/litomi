import { useEffect, useRef } from 'react'

type Props = {
  onResize: (element: HTMLElement) => void
  children: React.ReactNode
}

// ResizeObserverWrapper 컴포넌트: 자식 요소의 크기가 변경되면 onResize 콜백 호출
export default function ResizeObserverWrapper({ onResize, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(() => {
      if (ref.current) onResize(ref.current)
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [onResize])

  return <div ref={ref}>{children}</div>
}
