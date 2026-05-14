import '@test/setup.dom'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { SCROLL_THRESHOLD_PX } from '@/constants/policy'

import {
  revealNavigationAutoHide,
  useNavigationAutoHideScrollElement,
  useNavigationAutoHideState,
} from './navigationAutoHide'

let currentWindowScrollY = 0

beforeEach(() => {
  cleanup()
  currentWindowScrollY = 0

  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    get: () => currentWindowScrollY,
  })

  window.requestAnimationFrame = requestAnimationFrame
  window.cancelAnimationFrame = cancelAnimationFrame
  revealNavigationAutoHide()
})

afterEach(() => {
  cleanup()
  revealNavigationAutoHide()
})

describe('navigationAutoHide', () => {
  test('window scroll hides on downward scroll and reveals on upward scroll', async () => {
    const view = render(<NavigationAutoHideStateProbe />)

    expect(getHiddenState(view.container)).toBe('false')

    currentWindowScrollY = SCROLL_THRESHOLD_PX + 1
    await dispatchScroll(window)

    expect(getHiddenState(view.container)).toBe('true')

    currentWindowScrollY = 1
    await dispatchScroll(window)

    expect(getHiddenState(view.container)).toBe('false')
  })

  test('registered scroll element is preferred over window', async () => {
    const view = render(<ElementScrollProbe />)
    const scrollElement = view.getByTestId('scroll-element')

    currentWindowScrollY = SCROLL_THRESHOLD_PX + 100
    await dispatchScroll(window)

    expect(getHiddenState(view.container)).toBe('false')

    scrollElement.scrollTop = SCROLL_THRESHOLD_PX + 1
    await dispatchScroll(scrollElement)

    expect(getHiddenState(view.container)).toBe('true')

    scrollElement.scrollTop = 1
    await dispatchScroll(scrollElement)

    expect(getHiddenState(view.container)).toBe('false')
  })

  test('latest registered scroll element wins until it is unregistered', async () => {
    const view = render(<StackedElementScrollProbe showSecond />)
    const firstScrollElement = view.getByTestId('first-scroll-element')
    const secondScrollElement = view.getByTestId('second-scroll-element')

    firstScrollElement.scrollTop = SCROLL_THRESHOLD_PX + 1
    await dispatchScroll(firstScrollElement)

    expect(getHiddenState(view.container)).toBe('false')

    secondScrollElement.scrollTop = SCROLL_THRESHOLD_PX + 1
    await dispatchScroll(secondScrollElement)

    expect(getHiddenState(view.container)).toBe('true')

    act(() => {
      revealNavigationAutoHide()
    })
    view.rerender(<StackedElementScrollProbe showSecond={false} />)

    firstScrollElement.scrollTop = SCROLL_THRESHOLD_PX + 2
    await dispatchScroll(firstScrollElement)

    expect(getHiddenState(view.container)).toBe('true')
  })

  test('revealNavigationAutoHide reveals without waiting for another scroll event', async () => {
    const view = render(<NavigationAutoHideStateProbe />)

    currentWindowScrollY = SCROLL_THRESHOLD_PX + 1
    await dispatchScroll(window)

    expect(getHiddenState(view.container)).toBe('true')

    act(() => {
      revealNavigationAutoHide()
    })

    expect(getHiddenState(view.container)).toBe('false')
  })
})

async function dispatchScroll(target: EventTarget) {
  await act(async () => {
    target.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

function ElementScrollProbe() {
  const setScrollElement = useNavigationAutoHideScrollElement()

  return (
    <>
      <div data-testid="scroll-element" ref={setScrollElement} />
      <NavigationAutoHideStateProbe />
    </>
  )
}

function getHiddenState(container: HTMLElement) {
  return container.querySelector('[data-navigation-hidden]')?.getAttribute('data-navigation-hidden')
}

function NavigationAutoHideStateProbe() {
  const isNavigationHidden = useNavigationAutoHideState()

  return <output data-navigation-hidden={String(isNavigationHidden)} />
}

function StackedElementScrollProbe({ showSecond }: { showSecond: boolean }) {
  const setFirstScrollElement = useNavigationAutoHideScrollElement()
  const setSecondScrollElement = useNavigationAutoHideScrollElement()

  return (
    <>
      <div data-testid="first-scroll-element" ref={setFirstScrollElement} />
      {showSecond && <div data-testid="second-scroll-element" ref={setSecondScrollElement} />}
      <NavigationAutoHideStateProbe />
    </>
  )
}
