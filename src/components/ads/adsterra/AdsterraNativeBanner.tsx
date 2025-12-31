'use client'

import { useEffect, useRef } from 'react'

const CONTAINER_ID = 'container-733f54cc8c2f06bdea8a9b93723bc9a2'
const SCRIPT_SRC = 'https://pl28371828.effectivegatecpm.com/733f54cc8c2f06bdea8a9b93723bc9a2/invoke.js'

type Props = {
  className?: string
}

export default function AdsterraNativeBanner({ className = '' }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const didInitRef = useRef(false)

  useEffect(() => {
    if (didInitRef.current) {
      return
    }

    didInitRef.current = true

    const wrapper = wrapperRef.current
    if (!wrapper) {
      return
    }

    // NOTE: 재마운트/재시도 시 중복 생성 방지
    const existingScript = wrapper.querySelector<HTMLScriptElement>('script[data-adsterra-native-banner="true"]')
    if (existingScript) {
      existingScript.remove()
    }

    const script = document.createElement('script')
    script.async = true
    script.src = SCRIPT_SRC
    script.setAttribute('data-cfasync', 'false')
    script.setAttribute('data-adsterra-native-banner', 'true')

    // NOTE: 원본 스니펫과 동일하게 script → container 순서를 맞춰요.
    const container = wrapper.querySelector(`#${CSS.escape(CONTAINER_ID)}`)
    if (container) {
      wrapper.insertBefore(script, container)
    } else {
      wrapper.appendChild(script)
    }

    return () => {
      script.remove()
    }
  }, [])

  return (
    <div className={className} ref={wrapperRef}>
      <div className="aspect-736/229" id={CONTAINER_ID} />
    </div>
  )
}
