import { Window } from 'happy-dom'

// DOM 설정은 필요한 테스트에서만 불러와서 순수 유닛 테스트나 백엔드 테스트가 happy-dom을 미리 올리지 않게 한다.
const window = new Window({
  url: 'http://localhost:3000',
  width: 1024,
  height: 768,
})

window.SyntaxError = globalThis.SyntaxError

// 이 모듈을 가져오기만 하면 파일에서 DOM 전역 객체를 바로 쓸 수 있어야 한다.
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.window = window
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.document = window.document
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.navigator = window.navigator
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.HTMLElement = window.HTMLElement
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.Element = window.Element
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.Node = window.Node
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.Event = window.Event
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.CustomEvent = window.CustomEvent
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.HTMLFormElement = window.HTMLFormElement
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.HTMLInputElement = window.HTMLInputElement
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.HTMLImageElement = window.HTMLImageElement
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.HTMLSourceElement = window.HTMLSourceElement
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.FormData = window.FormData
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.CustomElementRegistry = window.CustomElementRegistry
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.customElements = window.customElements
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.MutationObserver = window.MutationObserver
global.localStorage = window.localStorage
global.sessionStorage = window.sessionStorage
// @ts-expect-error - DOM 전역 객체를 추가한다.
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return window.setTimeout(() => callback(Date.now()), 0)
}

global.cancelAnimationFrame = (id: number) => {
  // @ts-expect-error - DOM 전역 객체를 추가한다.
  return window.clearTimeout(id)
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

// @ts-expect-error - DOM 전역 객체를 추가한다.
global.IntersectionObserver = TestIntersectionObserver
