export class Stage {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  dpr = 1
  height = 0
  width = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      throw new Error('Could not get 2D context')
    }
    this.ctx = ctx
    this.dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  }

  addEventListener(event: string, handler: (event: unknown) => void) {
    if (event === 'ticker') {
      // Simple ticker implementation
      const tick = () => {
        handler({})
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    } else if (event === 'pointerstart') {
      this.canvas.addEventListener('pointerdown', (e) => {
        const rect = this.canvas.getBoundingClientRect()
        handler({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          onCanvas: true,
        })
      })
    } else if (event === 'pointerend') {
      this.canvas.addEventListener('pointerup', handler)
    } else if (event === 'pointermove') {
      this.canvas.addEventListener('pointermove', (e) => {
        const rect = this.canvas.getBoundingClientRect()
        handler({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          onCanvas: true,
        })
      })
    }
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height

    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
  }
}
