import { Window } from 'happy-dom'

// DOM 설정은 필요한 테스트에서만 불러와서 순수 유닛 테스트나 백엔드 테스트가 happy-dom을 미리 올리지 않게 한다.
const window = new Window({
  url: 'http://localhost:3000',
  width: 1024,
  height: 768,
})

const testGlobal = globalThis as Record<string, unknown>

window.SyntaxError = globalThis.SyntaxError

// 이 모듈을 가져오기만 하면 파일에서 DOM 전역 객체를 바로 쓸 수 있어야 한다.
testGlobal.window = window
testGlobal.document = window.document
testGlobal.navigator = window.navigator
testGlobal.HTMLElement = window.HTMLElement
testGlobal.Element = window.Element
testGlobal.Node = window.Node
testGlobal.Event = window.Event
testGlobal.CustomEvent = window.CustomEvent
testGlobal.HTMLFormElement = window.HTMLFormElement
testGlobal.HTMLInputElement = window.HTMLInputElement
testGlobal.HTMLImageElement = window.HTMLImageElement
testGlobal.HTMLSourceElement = window.HTMLSourceElement
testGlobal.FormData = window.FormData
testGlobal.CustomElementRegistry = window.CustomElementRegistry
testGlobal.customElements = window.customElements
testGlobal.MutationObserver = window.MutationObserver
testGlobal.localStorage = window.localStorage
testGlobal.sessionStorage = window.sessionStorage
testGlobal.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return window.setTimeout(() => callback(Date.now()), 0) as unknown as number
}

testGlobal.cancelAnimationFrame = (id: number) => {
  return window.clearTimeout(id as unknown as ReturnType<typeof window.setTimeout>)
}

class TestIntersectionObserver implements IntersectionObserver {
  static instances = new Set<TestIntersectionObserver>()

  readonly root: Document | Element | null
  readonly rootMargin: string
  readonly thresholds: number[]

  private readonly callback: IntersectionObserverCallback
  private readonly elements = new Set<Element>()

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback
    this.root = options.root ?? null
    this.rootMargin = options.rootMargin ?? '0px'
    this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold ?? 0]
    TestIntersectionObserver.instances.add(this)
  }

  static trigger(target: Element, isIntersecting = true) {
    for (const observer of TestIntersectionObserver.instances) {
      if (!observer.elements.has(target)) {
        continue
      }

      const rect = target.getBoundingClientRect()

      observer.callback(
        [
          {
            boundingClientRect: rect,
            intersectionRatio: isIntersecting ? 1 : 0,
            intersectionRect: rect,
            isIntersecting,
            rootBounds: null,
            target,
            time: Date.now(),
          },
        ] satisfies IntersectionObserverEntry[],
        observer,
      )
    }
  }

  disconnect() {
    this.elements.clear()
    TestIntersectionObserver.instances.delete(this)
  }

  observe(element: Element) {
    this.elements.add(element)
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  unobserve(element: Element) {
    this.elements.delete(element)
  }
}

testGlobal.IntersectionObserver = TestIntersectionObserver
