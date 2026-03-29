import { Window } from 'happy-dom'

// Keep DOM setup opt-in so unit/backend-only runs do not preload happy-dom.
const window = new Window({
  url: 'http://localhost:3000',
  width: 1024,
  height: 768,
})

window.SyntaxError = globalThis.SyntaxError

// Importing this module should be enough to make DOM globals available in the file.
// @ts-expect-error - Adding DOM globals
global.window = window
// @ts-expect-error - Adding DOM globals
global.document = window.document
// @ts-expect-error - Adding DOM globals
global.navigator = window.navigator
// @ts-expect-error - Adding DOM globals
global.HTMLElement = window.HTMLElement
// @ts-expect-error - Adding DOM globals
global.Element = window.Element
// @ts-expect-error - Adding DOM globals
global.Node = window.Node
// @ts-expect-error - Adding DOM globals
global.Event = window.Event
// @ts-expect-error - Adding DOM globals
global.CustomEvent = window.CustomEvent
// @ts-expect-error - Adding DOM globals
global.HTMLFormElement = window.HTMLFormElement
// @ts-expect-error - Adding DOM globals
global.HTMLInputElement = window.HTMLInputElement
// @ts-expect-error - Adding DOM globals
global.HTMLImageElement = window.HTMLImageElement
// @ts-expect-error - Adding DOM globals
global.HTMLSourceElement = window.HTMLSourceElement
// @ts-expect-error - Adding DOM globals
global.FormData = window.FormData
// @ts-expect-error - Adding DOM globals
global.CustomElementRegistry = window.CustomElementRegistry
// @ts-expect-error - Adding DOM globals
global.customElements = window.customElements
// @ts-expect-error - Adding DOM globals
global.MutationObserver = window.MutationObserver
global.localStorage = window.localStorage
global.sessionStorage = window.sessionStorage
// @ts-expect-error - Adding DOM globals
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return window.setTimeout(() => callback(Date.now()), 0)
}

global.cancelAnimationFrame = (id: number) => {
  // @ts-expect-error - Adding DOM globals
  return window.clearTimeout(id)
}
