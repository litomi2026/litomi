import type { FireworkConfig } from './types'

import { MyMath } from './MyMath'
import { Stage } from './Stage'

const MAX_WIDTH = 7680
const MAX_HEIGHT = 4320
const GRAVITY = 0.9

const QUALITY_LOW = 1
const QUALITY_NORMAL = 2
const QUALITY_HIGH = 3

const SKY_LIGHT_NONE = 0

const COLOR = {
  Red: '#ff0043',
  Green: '#14fc56',
  Blue: '#1e7fff',
  Purple: '#e60aff',
  Gold: '#ffbf36',
  White: '#ffffff',
}

const INVISIBLE = '_INVISIBLE_'
const PI_2 = Math.PI * 2
const PI_HALF = Math.PI * 0.5

interface BurstFlashCollection extends Omit<ParticleCollection<BurstFlashInstance>, 'active' | 'add'> {
  active: BurstFlashInstance[]
  add: (x: number, y: number, radius: number) => BurstFlashInstance
}

interface BurstFlashInstance {
  radius: number
  x: number
  y: number
}

interface EngineOptions {
  config: FireworkConfig
  mainCanvas: HTMLCanvasElement
  onConfigUpdate?: (config: FireworkConfig) => void
  onMenuToggle?: (menuOpen: boolean) => void
  onPauseToggle?: (paused: boolean) => void
  onSoundToggle?: (enabled: boolean) => void
  trailsCanvas: HTMLCanvasElement
}

interface ParticleCollection<T> {
  _new: () => T
  _pool: T[]
  active: Record<string, T[]>
  add: (...args: unknown[]) => T
  returnInstance: (instance: T) => void
}

interface ShellOptions {
  color?: string | 'random' | string[]
  crackle?: boolean
  crossette?: boolean
  fallingLeaves?: boolean
  floral?: boolean
  glitter?: string | undefined
  glitterColor?: string
  horsetail?: boolean
  pistil?: boolean
  pistilColor?: string
  ring?: boolean
  secondColor?: string
  shellSize?: number
  spreadSize?: number
  starCount?: number
  starDensity?: number
  starLife?: number
  starLifeVariation?: number
  streamers?: boolean
  strobe?: boolean
  strobeColor?: string
}

interface SoundManager {
  _lastSmallBurstTime: number
  baseURL: string
  ctx: AudioContext | null
  pauseAll: () => void
  playSound: (type: string, scale?: number) => void
  preload: () => Promise<undefined | void>
  resumeAll: () => void
  sources: Record<string, SoundSource>
}

interface SoundSource {
  buffers: AudioBuffer[]
  fileNames: string[]
  playbackRateMax: number
  playbackRateMin: number
  volume: number
}

interface SparkCollection extends Omit<ParticleCollection<SparkInstance>, 'add'> {
  add: (x: number, y: number, color: string, angle: number, speed: number, life: number) => SparkInstance
  airDrag: number
  drawWidth: number
}

interface SparkInstance {
  color: string
  life: number
  prevX: number
  prevY: number
  speedX: number
  speedY: number
  x: number
  y: number
}

interface StarCollection extends Omit<ParticleCollection<StarInstance>, 'add'> {
  add: (
    x: number,
    y: number,
    color: string,
    angle: number,
    speed: number,
    life: number,
    speedOffX?: number,
    speedOffY?: number,
  ) => StarInstance
  airDrag: number
  airDragHeavy: number
  drawWidth: number
}

interface StarInstance {
  color: string
  colorChanged?: boolean
  fullLife: number
  heavy: boolean
  life: number
  onDeath?: ((star: StarInstance) => void) | null
  prevX: number
  prevY: number
  secondColor?: string | null
  sparkColor: string
  sparkFreq: number
  sparkLife: number
  sparkLifeVariation: number
  sparkSpeed: number
  sparkTimer: number
  speedX: number
  speedY: number
  spinAngle: number
  spinRadius: number
  spinSpeed: number
  strobe?: boolean
  strobeFreq?: number
  transitionTime: number
  updateFrame?: number
  visible: boolean
  x: number
  y: number
}

class FireworkEngine {
  public onMenuToggle?: (menuOpen: boolean) => void
  public onPauseToggle?: (paused: boolean) => void
  public onSoundToggle?: (enabled: boolean) => void

  private animationFrameId: number | null = null
  private autoLaunchTime = 0
  private BurstFlash!: BurstFlashCollection
  private canvasContainer: HTMLElement | null = null
  private COLOR_CODES: string[]
  private COLOR_CODES_W_INVIS: string[]
  private COLOR_TUPLES: Record<string, { r: number; g: number; b: number }>
  private config: FireworkConfig
  private currentFinaleCount = 0
  private currentFrame = 0
  private currentSkyColor = { r: 0, g: 0, b: 0 }
  private finaleCount = 32
  private isFirstSeq = true
  private isHighQuality = false
  private isLowQuality = false
  private isUpdatingSpeed = false
  private lastColor: string | null = null
  private lastFrameTime = 0
  private mainStage: Stage
  private menuOpen = false
  private paused = true
  private quality = QUALITY_NORMAL
  private seqSmallBarrageLastCalled = Date.now()
  private simSpeed = 1
  private soundEnabled = false
  private soundManager!: SoundManager
  private Spark!: SparkCollection
  private speedBarOpacity = 0
  private stageH = 0
  private stageW = 0
  private Star!: StarCollection
  private targetSkyColor = { r: 0, g: 0, b: 0 }
  private trailsStage: Stage

  private get shellNames(): string[] {
    return Object.keys(this.shellTypes)
  }

  private get shellTypes(): Record<string, (size: number) => ShellOptions> {
    return {
      Random: this.randomShell,
      Crackle: this.crackleShell,
      Crossette: this.crossetteShell,
      Crysanthemum: this.crysanthemumShell,
      'Falling Leaves': this.fallingLeavesShell,
      Floral: this.floralShell,
      Ghost: this.ghostShell,
      'Horse Tail': this.horsetailShell,
      Palm: this.palmShell,
      Ring: this.ringShell,
      Strobe: this.strobeShell,
      Willow: this.willowShell,
    }
  }

  constructor(options: EngineOptions) {
    this.trailsStage = new Stage(options.trailsCanvas)
    this.mainStage = new Stage(options.mainCanvas)
    this.config = options.config
    this.onMenuToggle = options.onMenuToggle
    this.onPauseToggle = options.onPauseToggle
    this.onSoundToggle = options.onSoundToggle
    this.COLOR_CODES = Object.values(COLOR)
    this.COLOR_CODES_W_INVIS = [...this.COLOR_CODES, INVISIBLE]
    this.COLOR_TUPLES = {}

    this.COLOR_CODES.forEach((hex) => {
      this.COLOR_TUPLES[hex] = {
        r: parseInt(hex.substr(1, 2), 16),
        g: parseInt(hex.substr(3, 2), 16),
        b: parseInt(hex.substr(5, 2), 16),
      }
    })

    this.initParticles()
    this.initSoundManager()
    this.handleResize()

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize)
      window.addEventListener('keydown', this.handleKeydown)
      this.setupPointerEvents()
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize)
      window.removeEventListener('keydown', this.handleKeydown)
    }
  }

  async init() {
    this.updateQuality()
    this.handleResize()
    return this.soundManager.preload().catch(() => {
      // Audio preload failed, continue anyway
      return Promise.resolve()
    })
  }

  launchShell(x: number, y: number) {
    const shellConfig = this.shellFromConfig(parseFloat(this.config.size))
    const shell = new Shell(this, shellConfig)
    shell.launch(x, y)
  }

  setCanvasContainer(element: HTMLElement) {
    this.canvasContainer = element
  }

  setMenuOpen(menuOpen: boolean) {
    this.menuOpen = menuOpen
    // Pause/resume sound based on menu state
    const canPlaySound = this.isRunning()
    if (canPlaySound) {
      this.soundManager.resumeAll()
    } else {
      this.soundManager.pauseAll()
    }
  }

  togglePause(paused?: boolean) {
    const newPaused = paused !== undefined ? paused : !this.paused
    this.paused = newPaused
    if (!newPaused && !this.animationFrameId) {
      this.lastFrameTime = 0
      this.startAnimation()
    }
    // Update sound state
    const canPlaySound = this.isRunning()
    if (canPlaySound && this.soundEnabled) {
      this.soundManager.resumeAll()
    } else {
      this.soundManager.pauseAll()
    }
    if (this.onPauseToggle) {
      this.onPauseToggle(newPaused)
    }
  }

  toggleSound(enabled: boolean) {
    const wasEnabled = this.soundEnabled
    this.soundEnabled = enabled
    if (enabled && !wasEnabled && this.isRunning()) {
      this.soundManager.resumeAll()
    } else if (!enabled && wasEnabled) {
      this.soundManager.pauseAll()
    }
    if (this.onSoundToggle) {
      this.onSoundToggle(enabled)
    }
  }

  updateConfig(config: FireworkConfig) {
    this.config = config
    this.updateQuality()
    this.handleResize()

    // Update sky background
    if (this.canvasContainer && this.skyLightingSelector() === SKY_LIGHT_NONE) {
      this.canvasContainer.style.backgroundColor = '#000'
    }
  }

  private colorSky(speed: number) {
    const maxSkySaturation = this.skyLightingSelector() * 15
    const maxStarCount = 500
    let totalStarCount = 0
    this.targetSkyColor.r = 0
    this.targetSkyColor.g = 0
    this.targetSkyColor.b = 0

    this.COLOR_CODES.forEach((color) => {
      const tuple = this.COLOR_TUPLES[color]
      const count = this.Star.active[color].length
      totalStarCount += count
      this.targetSkyColor.r += tuple.r * count
      this.targetSkyColor.g += tuple.g * count
      this.targetSkyColor.b += tuple.b * count
    })

    const intensity = Math.pow(Math.min(1, totalStarCount / maxStarCount), 0.3)
    const maxColorComponent = Math.max(1, this.targetSkyColor.r, this.targetSkyColor.g, this.targetSkyColor.b)
    this.targetSkyColor.r = (this.targetSkyColor.r / maxColorComponent) * maxSkySaturation * intensity
    this.targetSkyColor.g = (this.targetSkyColor.g / maxColorComponent) * maxSkySaturation * intensity
    this.targetSkyColor.b = (this.targetSkyColor.b / maxColorComponent) * maxSkySaturation * intensity

    const colorChange = 10
    this.currentSkyColor.r += ((this.targetSkyColor.r - this.currentSkyColor.r) / colorChange) * speed
    this.currentSkyColor.g += ((this.targetSkyColor.g - this.currentSkyColor.g) / colorChange) * speed
    this.currentSkyColor.b += ((this.targetSkyColor.b - this.currentSkyColor.b) / colorChange) * speed

    if (this.canvasContainer) {
      this.canvasContainer.style.backgroundColor = `rgb(${this.currentSkyColor.r | 0}, ${this.currentSkyColor.g | 0}, ${this.currentSkyColor.b | 0})`
    }
  }

  private crackleEffect = (star: StarInstance) => {
    const count = this.isHighQuality ? 32 : 16
    this.createParticleArc(0, PI_2, count, 1.8, (angle) => {
      this.Spark.add(star.x, star.y, COLOR.Gold, angle, Math.pow(Math.random(), 0.45) * 2.4, 300 + Math.random() * 200)
    })
  }

  private crackleShell = (size = 1): ShellOptions => {
    const color = Math.random() < 0.75 ? COLOR.Gold : this.randomColor()
    return {
      shellSize: size,
      spreadSize: 380 + size * 75,
      starDensity: this.isLowQuality ? 0.65 : 1,
      starLife: 600 + size * 100,
      starLifeVariation: 0.32,
      glitter: 'light',
      glitterColor: COLOR.Gold,
      color,
      crackle: true,
      pistil: Math.random() < 0.65,
      pistilColor: this.makePistilColor(color),
    }
  }

  // Particle creation helpers
  private createBurst(
    count: number,
    particleFactory: (angle: number, ringSize: number) => void,
    startAngle = 0,
    arcLength = PI_2,
  ) {
    const R = 0.5 * Math.sqrt(count / Math.PI)
    const C = 2 * R * Math.PI
    const C_HALF = C / 2

    for (let i = 0; i <= C_HALF; i++) {
      const ringAngle = (i / C_HALF) * PI_HALF
      const ringSize = Math.cos(ringAngle)
      const partsPerFullRing = C * ringSize
      const partsPerArc = partsPerFullRing * (arcLength / PI_2)

      const angleInc = PI_2 / partsPerFullRing
      const angleOffset = Math.random() * angleInc + startAngle
      const maxRandomAngleOffset = angleInc * 0.33

      for (let i = 0; i < partsPerArc; i++) {
        const randomAngleOffset = Math.random() * maxRandomAngleOffset
        const angle = angleInc * i + angleOffset + randomAngleOffset
        particleFactory(angle, ringSize)
      }
    }
  }

  private createParticleArc(
    start: number,
    arcLength: number,
    count: number,
    randomness: number,
    particleFactory: (angle: number) => void,
  ) {
    const angleDelta = arcLength / count
    const end = start + arcLength - angleDelta * 0.5

    if (end > start) {
      for (let angle = start; angle < end; angle = angle + angleDelta) {
        particleFactory(angle + Math.random() * angleDelta * randomness)
      }
    } else {
      for (let angle = start; angle > end; angle = angle + angleDelta) {
        particleFactory(angle + Math.random() * angleDelta * randomness)
      }
    }
  }

  // Effect functions
  private crossetteEffect = (star: StarInstance) => {
    const startAngle = Math.random() * PI_HALF
    this.createParticleArc(startAngle, PI_2, 4, 0.5, (angle) => {
      this.Star.add(star.x, star.y, star.color, angle, Math.random() * 0.6 + 0.75, 600)
    })
  }

  private crossetteShell = (size = 1): ShellOptions => {
    const color = this.randomColor({ limitWhite: true })
    return {
      shellSize: size,
      spreadSize: 300 + size * 100,
      starLife: 750 + size * 160,
      starLifeVariation: 0.4,
      starDensity: 0.85,
      color,
      crossette: true,
      pistil: Math.random() < 0.5,
      pistilColor: this.makePistilColor(color),
    }
  }

  // Shell factory functions
  private crysanthemumShell = (size = 1): ShellOptions => {
    const glitter = Math.random() < 0.25
    const singleColor = Math.random() < 0.72
    const color = singleColor
      ? this.randomColor({ limitWhite: true })
      : [this.randomColor(), this.randomColor({ notSame: true })]
    const pistil = singleColor && Math.random() < 0.42
    const pistilColor = pistil ? this.makePistilColor(color as string) : undefined
    const secondColor =
      singleColor && (Math.random() < 0.2 || color === COLOR.White)
        ? pistilColor || this.randomColor({ notColor: color as string, limitWhite: true })
        : undefined
    const streamers = !pistil && color !== COLOR.White && Math.random() < 0.42
    let starDensity = glitter ? 1.1 : 1.25
    if (this.isLowQuality) starDensity *= 0.8
    if (this.isHighQuality) starDensity = 1.2
    return {
      shellSize: size,
      spreadSize: 300 + size * 100,
      starLife: 900 + size * 200,
      starDensity,
      color,
      secondColor,
      glitter: glitter ? 'light' : undefined,
      glitterColor: this.whiteOrGold(),
      pistil,
      pistilColor,
      streamers,
    }
  }

  private fallingLeavesEffect = (star: StarInstance) => {
    this.createBurst(7, (angle, speedMult) => {
      const newStar = this.Star.add(
        star.x,
        star.y,
        INVISIBLE,
        angle,
        speedMult * 2.4,
        2400 + Math.random() * 600,
        star.speedX,
        star.speedY,
      )
      newStar.sparkColor = COLOR.Gold
      newStar.sparkFreq = 144 / this.quality
      newStar.sparkSpeed = 0.28
      newStar.sparkLife = 750
      newStar.sparkLifeVariation = 3.2
    })
    this.BurstFlash.add(star.x, star.y, 46)
    this.soundManager.playSound('burstSmall')
  }

  private fallingLeavesShell = (size = 1): ShellOptions => ({
    shellSize: size,
    color: INVISIBLE,
    spreadSize: 300 + size * 120,
    starDensity: 0.12,
    starLife: 500 + size * 50,
    starLifeVariation: 0.5,
    glitter: 'medium',
    glitterColor: COLOR.Gold,
    fallingLeaves: true,
  })

  private fitShellPositionInBoundsH(position: number): number {
    const edge = 0.18
    return (1 - edge * 2) * position + edge
  }

  private fitShellPositionInBoundsV(position: number): number {
    return position * 0.75
  }

  private floralEffect = (star: StarInstance) => {
    const count = 12 + 6 * this.quality
    this.createBurst(count, (angle, speedMult) => {
      this.Star.add(
        star.x,
        star.y,
        star.color,
        angle,
        speedMult * 2.4,
        1000 + Math.random() * 300,
        star.speedX,
        star.speedY,
      )
    })
    this.BurstFlash.add(star.x, star.y, 46)
    this.soundManager.playSound('burstSmall')
  }

  private floralShell = (size = 1): ShellOptions => ({
    shellSize: size,
    spreadSize: 300 + size * 120,
    starDensity: 0.12,
    starLife: 500 + size * 50,
    starLifeVariation: 0.5,
    color:
      Math.random() < 0.65
        ? 'random'
        : Math.random() < 0.15
          ? this.randomColor()
          : [this.randomColor(), this.randomColor({ notSame: true })],
    floral: true,
  })

  private getRandomShellSize(): { height: number; size: number; x: number } {
    const baseSize = parseFloat(this.config.size)
    const maxVariance = Math.min(2.5, baseSize)
    const variance = Math.random() * maxVariance
    const size = baseSize - variance
    const height = maxVariance === 0 ? Math.random() : 1 - variance / maxVariance
    const centerOffset = Math.random() * (1 - height * 0.65) * 0.5
    const x = Math.random() < 0.5 ? 0.5 - centerOffset : 0.5 + centerOffset
    return {
      size,
      x: this.fitShellPositionInBoundsH(x),
      height: this.fitShellPositionInBoundsV(height),
    }
  }

  private ghostShell = (size = 1): ShellOptions => {
    const shell = this.crysanthemumShell(size)
    shell.starLife! *= 1.5
    const ghostColor = this.randomColor({ notColor: COLOR.White })
    shell.streamers = true
    shell.color = INVISIBLE
    shell.secondColor = ghostColor
    shell.glitter = undefined
    return shell
  }

  private handleKeydown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase()

    if (key === 'p') {
      this.togglePause()
    } else if (key === 'o') {
      this.toggleMenu(undefined, true)
    } else if (key === 'escape') {
      this.toggleMenu(false, true)
    } else if (key === 's') {
      this.toggleSound(!this.soundEnabled)
    }
  }

  private handlePointerEnd = () => {
    this.isUpdatingSpeed = false
  }

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.isRunning()) return

    if (this.isUpdatingSpeed) {
      const rect = this.mainStage.canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      this.updateSpeedFromEvent(x, y)
    }
  }

  private handlePointerStart = (event: PointerEvent) => {
    const rect = this.mainStage.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (!this.isRunning()) return

    // Check if speed adjustment was triggered
    if (this.updateSpeedFromEvent(x, y)) {
      this.isUpdatingSpeed = true
    } else {
      // Launch shell on click
      this.launchShell(x / rect.width, 1 - y / rect.height)
    }
  }

  private handleResize = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920
    const h = typeof window !== 'undefined' ? window.innerHeight : 1080
    const containerW = Math.min(w, MAX_WIDTH)
    const containerH = w <= 420 ? h : Math.min(h, MAX_HEIGHT)

    this.trailsStage.resize(containerW, containerH)
    this.mainStage.resize(containerW, containerH)

    const scaleFactor = this.config.scaleFactor
    this.stageW = containerW / scaleFactor
    this.stageH = containerH / scaleFactor
  }

  private horsetailShell = (size = 1): ShellOptions => {
    const color = this.randomColor()
    return {
      shellSize: size,
      horsetail: true,
      color,
      spreadSize: 250 + size * 38,
      starDensity: 0.9,
      starLife: 2500 + size * 300,
      glitter: 'medium',
      glitterColor: Math.random() < 0.5 ? this.whiteOrGold() : color,
      strobe: color === COLOR.White,
    }
  }

  private initParticles() {
    const createParticleCollection = () => {
      const collection: Record<string, StarInstance[]> = {}
      this.COLOR_CODES_W_INVIS.forEach((color) => {
        collection[color] = []
      })
      return collection
    }

    const createSparkCollection = () => {
      const collection: Record<string, SparkInstance[]> = {}
      this.COLOR_CODES_W_INVIS.forEach((color) => {
        collection[color] = []
      })
      return collection
    }

    this.Star = {
      drawWidth: 3,
      airDrag: 0.98,
      airDragHeavy: 0.992,
      active: createParticleCollection(),
      _pool: [] as StarInstance[],
      _new: () => ({}) as StarInstance,
      add: (
        x: number,
        y: number,
        color: string,
        angle: number,
        speed: number,
        life: number,
        speedOffX = 0,
        speedOffY = 0,
      ) => {
        const instance = this.Star._pool.pop() || this.Star._new()
        instance.visible = true
        instance.heavy = false
        instance.x = x
        instance.y = y
        instance.prevX = x
        instance.prevY = y
        instance.color = color
        instance.speedX = Math.sin(angle) * speed + speedOffX
        instance.speedY = Math.cos(angle) * speed + speedOffY
        instance.life = life
        instance.fullLife = life
        instance.spinAngle = Math.random() * PI_2
        instance.spinSpeed = 0.8
        instance.spinRadius = 0
        instance.sparkFreq = 0
        instance.sparkSpeed = 1
        instance.sparkTimer = 0
        instance.sparkColor = color
        instance.sparkLife = 750
        instance.sparkLifeVariation = 0.25
        instance.strobe = false
        instance.transitionTime = 0
        instance.colorChanged = false
        this.Star.active[color].push(instance)
        return instance
      },
      returnInstance: (instance: StarInstance) => {
        if (instance.onDeath) {
          instance.onDeath(instance)
        }
        instance.onDeath = null
        instance.secondColor = null
        instance.transitionTime = 0
        instance.colorChanged = false
        this.Star._pool.push(instance)
      },
    }

    this.Spark = {
      drawWidth: this.quality === QUALITY_HIGH ? 0.75 : 1,
      airDrag: 0.9,
      active: createSparkCollection(),
      _pool: [] as SparkInstance[],
      _new: () => ({}) as SparkInstance,
      add: (x: number, y: number, color: string, angle: number, speed: number, life: number) => {
        const instance = this.Spark._pool.pop() || this.Spark._new()
        instance.x = x
        instance.y = y
        instance.prevX = x
        instance.prevY = y
        instance.color = color
        instance.speedX = Math.sin(angle) * speed
        instance.speedY = Math.cos(angle) * speed
        instance.life = life
        this.Spark.active[color].push(instance)
        return instance
      },
      returnInstance: (instance: SparkInstance) => {
        this.Spark._pool.push(instance)
      },
    }

    this.BurstFlash = {
      active: [] as BurstFlashInstance[],
      _pool: [] as BurstFlashInstance[],
      _new: () => ({}) as BurstFlashInstance,
      add: (x: number, y: number, radius: number) => {
        const instance = this.BurstFlash._pool.pop() || this.BurstFlash._new()
        instance.x = x
        instance.y = y
        instance.radius = radius
        this.BurstFlash.active.push(instance)
        return instance
      },
      returnInstance: (instance: BurstFlashInstance) => {
        this.BurstFlash._pool.push(instance)
      },
    }
  }

  private initSoundManager() {
    this.soundManager = {
      baseURL: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/329180/',
      ctx:
        typeof window !== 'undefined'
          ? new (window.AudioContext ||
              (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
          : null,
      sources: {
        lift: {
          volume: 1,
          playbackRateMin: 0.85,
          playbackRateMax: 0.95,
          fileNames: ['lift1.mp3', 'lift2.mp3', 'lift3.mp3'],
          buffers: [] as AudioBuffer[],
        },
        burst: {
          volume: 1,
          playbackRateMin: 0.8,
          playbackRateMax: 0.9,
          fileNames: ['burst1.mp3', 'burst2.mp3'],
          buffers: [] as AudioBuffer[],
        },
        burstSmall: {
          volume: 0.25,
          playbackRateMin: 0.8,
          playbackRateMax: 1,
          fileNames: ['burst-sm-1.mp3', 'burst-sm-2.mp3'],
          buffers: [] as AudioBuffer[],
        },
        crackle: {
          volume: 0.2,
          playbackRateMin: 1,
          playbackRateMax: 1,
          fileNames: ['crackle1.mp3'],
          buffers: [] as AudioBuffer[],
        },
        crackleSmall: {
          volume: 0.3,
          playbackRateMin: 1,
          playbackRateMax: 1,
          fileNames: ['crackle-sm-1.mp3'],
          buffers: [] as AudioBuffer[],
        },
      },
      _lastSmallBurstTime: 0,
      preload: async () => {
        if (!this.soundManager.ctx) return Promise.resolve()

        const allFilePromises: Promise<AudioBuffer>[] = []

        const types = Object.keys(this.soundManager.sources)
        for (const type of types) {
          const source = this.soundManager.sources[type]
          const { fileNames } = source
          const filePromises: Promise<AudioBuffer>[] = []

          for (const fileName of fileNames) {
            const fileURL = this.soundManager.baseURL + fileName
            const promise = fetch(fileURL)
              .then((response) => {
                if (response.status >= 200 && response.status < 300) {
                  return response
                }
                throw new Error(response.statusText)
              })
              .then((response) => response.arrayBuffer())
              .then((data) => {
                return new Promise<AudioBuffer>((resolve) => {
                  this.soundManager.ctx?.decodeAudioData(data, resolve)
                })
              })

            filePromises.push(promise)
            allFilePromises.push(promise)
          }

          Promise.all(filePromises).then((buffers) => {
            source.buffers = buffers
          })
        }

        return Promise.all(allFilePromises).then(() => undefined)
      },
      pauseAll: () => {
        if (this.soundManager.ctx) {
          this.soundManager.ctx.suspend()
        }
      },
      resumeAll: () => {
        if (this.soundManager.ctx) {
          this.soundManager.playSound('lift', 0)
          setTimeout(() => {
            this.soundManager.ctx?.resume()
          }, 250)
        }
      },
      playSound: (type: string, scale = 1) => {
        if (!this.soundManager.ctx) return
        scale = MyMath.clamp(scale, 0, 1)

        // Disallow starting new sounds if not running, sound disabled, or in slow motion
        if (!this.isRunning() || !this.soundEnabled || this.simSpeed < 0.95) {
          return
        }

        if (type === 'burstSmall') {
          const now = Date.now()
          if (now - this.soundManager._lastSmallBurstTime < 20) {
            return
          }
          this.soundManager._lastSmallBurstTime = now
        }

        const source = this.soundManager.sources[type]
        if (!source || !source.buffers.length) {
          return
        }

        const initialVolume = source.volume
        const initialPlaybackRate = MyMath.random(source.playbackRateMin, source.playbackRateMax)

        const scaledVolume = initialVolume * scale
        const scaledPlaybackRate = initialPlaybackRate * (2 - scale)

        const gainNode = this.soundManager.ctx.createGain()
        gainNode.gain.value = scaledVolume

        const buffer = MyMath.randomChoice(source.buffers)
        const bufferSource = this.soundManager.ctx.createBufferSource()
        bufferSource.playbackRate.value = scaledPlaybackRate
        bufferSource.buffer = buffer
        bufferSource.connect(gainNode)
        gainNode.connect(this.soundManager.ctx.destination)
        bufferSource.start(0)
      },
    }
  }

  private isRunning(): boolean {
    return !this.paused && !this.menuOpen
  }

  // Color helpers
  private makePistilColor(shellColor: string): string {
    return shellColor === COLOR.White || shellColor === COLOR.Gold
      ? this.randomColor({ notColor: shellColor })
      : this.whiteOrGold()
  }

  private palmShell = (size = 1): ShellOptions => {
    const color = this.randomColor()
    const thick = Math.random() < 0.5
    return {
      shellSize: size,
      color,
      spreadSize: 250 + size * 75,
      starDensity: thick ? 0.15 : 0.4,
      starLife: 1800 + size * 200,
      glitter: thick ? 'thick' : 'heavy',
    }
  }

  private randomColor(options?: { limitWhite?: boolean; notColor?: string; notSame?: boolean }): string {
    const notSame = options?.notSame
    const notColor = options?.notColor
    const limitWhite = options?.limitWhite
    let color = this.randomColorSimple()

    if (limitWhite && color === COLOR.White && Math.random() < 0.6) {
      color = this.randomColorSimple()
    }

    if (notSame) {
      while (color === this.lastColor) {
        color = this.randomColorSimple()
      }
    } else if (notColor) {
      while (color === notColor) {
        color = this.randomColorSimple()
      }
    }

    this.lastColor = color
    return color
  }

  private randomColorSimple(): string {
    return this.COLOR_CODES[Math.floor(Math.random() * this.COLOR_CODES.length)]
  }

  private randomShell = (size: number): ShellOptions => {
    return this.shellTypes[this.randomShellName()](size)
  }

  private randomShellName(): string {
    return Math.random() < 0.5
      ? 'Crysanthemum'
      : this.shellNames[(Math.random() * (this.shellNames.length - 1) + 1) | 0]
  }

  private render(speed: number) {
    const { dpr } = this.mainStage
    const width = this.stageW
    const height = this.stageH
    const trailsCtx = this.trailsStage.ctx
    const mainCtx = this.mainStage.ctx

    if (this.skyLightingSelector() !== SKY_LIGHT_NONE) {
      this.colorSky(speed)
    }

    const scaleFactor = this.config.scaleFactor
    trailsCtx.scale(dpr * scaleFactor, dpr * scaleFactor)
    mainCtx.scale(dpr * scaleFactor, dpr * scaleFactor)

    trailsCtx.globalCompositeOperation = 'source-over'
    trailsCtx.fillStyle = `rgba(0, 0, 0, ${this.config.longExposure ? 0.0025 : 0.175 * speed})`
    trailsCtx.fillRect(0, 0, width, height)

    mainCtx.clearRect(0, 0, width, height)

    while (this.BurstFlash.active.length) {
      const bf = this.BurstFlash.active.pop()
      if (!bf) break
      const gradient = trailsCtx.createRadialGradient(bf.x, bf.y, 0, bf.x, bf.y, bf.radius)
      gradient.addColorStop(0.024, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.125, 'rgba(255, 160, 20, 0.2)')
      gradient.addColorStop(0.32, 'rgba(255, 140, 20, 0.11)')
      gradient.addColorStop(1, 'rgba(255, 120, 20, 0)')
      trailsCtx.fillStyle = gradient
      trailsCtx.fillRect(bf.x - bf.radius, bf.y - bf.radius, bf.radius * 2, bf.radius * 2)
      this.BurstFlash.returnInstance(bf)
    }

    trailsCtx.globalCompositeOperation = 'lighten'
    trailsCtx.lineWidth = this.Star.drawWidth
    trailsCtx.lineCap = this.isLowQuality ? 'square' : 'round'
    mainCtx.strokeStyle = '#fff'
    mainCtx.lineWidth = 1
    mainCtx.beginPath()

    this.COLOR_CODES.forEach((color) => {
      const stars = this.Star.active[color]
      trailsCtx.strokeStyle = color
      trailsCtx.beginPath()
      stars.forEach((star: StarInstance) => {
        if (star.visible) {
          trailsCtx.moveTo(star.x, star.y)
          trailsCtx.lineTo(star.prevX, star.prevY)
          mainCtx.moveTo(star.x, star.y)
          mainCtx.lineTo(star.x - star.speedX * 1.6, star.y - star.speedY * 1.6)
        }
      })
      trailsCtx.stroke()
    })
    mainCtx.stroke()

    trailsCtx.lineWidth = this.Spark.drawWidth
    trailsCtx.lineCap = 'butt'
    this.COLOR_CODES.forEach((color) => {
      const sparks = this.Spark.active[color]
      trailsCtx.strokeStyle = color
      trailsCtx.beginPath()
      sparks.forEach((spark: SparkInstance) => {
        trailsCtx.moveTo(spark.x, spark.y)
        trailsCtx.lineTo(spark.prevX, spark.prevY)
      })
      trailsCtx.stroke()
    })

    // Render speed bar if visible
    if (this.speedBarOpacity) {
      const speedBarHeight = 6
      mainCtx.globalAlpha = this.speedBarOpacity
      mainCtx.fillStyle = COLOR.Blue
      mainCtx.fillRect(0, height - speedBarHeight, width * this.simSpeed, speedBarHeight)
      mainCtx.globalAlpha = 1
    }

    trailsCtx.setTransform(1, 0, 0, 1, 0, 0)
    mainCtx.setTransform(1, 0, 0, 1, 0, 0)
  }

  private ringShell = (size = 1): ShellOptions => {
    const color = this.randomColor()
    const pistil = Math.random() < 0.75
    return {
      shellSize: size,
      ring: true,
      color,
      spreadSize: 300 + size * 100,
      starLife: 900 + size * 200,
      starCount: 2.2 * PI_2 * (size + 1),
      pistil,
      pistilColor: this.makePistilColor(color),
      glitter: !pistil ? 'light' : undefined,
      glitterColor: color === COLOR.Gold ? COLOR.Gold : COLOR.White,
      streamers: Math.random() < 0.3,
    }
  }

  private seqPyramid = (): number => {
    const IS_DESKTOP = typeof window !== 'undefined' && window.innerWidth > 800
    const barrageCountHalf = IS_DESKTOP ? 7 : 4
    const largeSize = parseFloat(this.config.size)
    const smallSize = Math.max(0, largeSize - 3)
    const randomMainShell = Math.random() < 0.78 ? this.crysanthemumShell : this.ringShell
    const randomSpecialShell = this.randomShell

    const launchShell = (x: number, useSpecial: boolean) => {
      const isRandom = this.config.shell === 'Random'
      const shellType = isRandom
        ? useSpecial
          ? randomSpecialShell
          : randomMainShell
        : this.shellTypes[this.config.shell]
      const shell = new Shell(this, shellType(useSpecial ? largeSize : smallSize))
      const height = x <= 0.5 ? x / 0.5 : (1 - x) / 0.5
      shell.launch(x, useSpecial ? 0.75 : height * 0.42)
    }

    let count = 0
    let delay = 0
    while (count <= barrageCountHalf) {
      if (count === barrageCountHalf) {
        setTimeout(() => {
          launchShell(0.5, true)
        }, delay)
      } else {
        const offset = (count / barrageCountHalf) * 0.5
        const delayOffset = Math.random() * 30 + 30
        setTimeout(() => {
          launchShell(offset, false)
        }, delay)
        setTimeout(() => {
          launchShell(1 - offset, false)
        }, delay + delayOffset)
      }

      count++
      delay += 200
    }

    return 3400 + barrageCountHalf * 250
  }

  private seqRandomFastShell = (): number => {
    const fastShellBlacklist = ['Falling Leaves', 'Floral', 'Willow']
    const isRandom = this.config.shell === 'Random'
    let shellName = isRandom ? this.randomShellName() : this.config.shell
    if (isRandom) {
      while (fastShellBlacklist.includes(shellName)) {
        shellName = this.randomShellName()
      }
    }
    const shellType = this.shellTypes[shellName]
    const size = this.getRandomShellSize()
    const shell = new Shell(this, shellType(size.size))
    shell.launch(size.x, size.height)

    const extraDelay = shell.starLife

    return 900 + Math.random() * 600 + extraDelay
  }

  // Sequence functions
  private seqRandomShell = (): number => {
    const size = this.getRandomShellSize()
    const shell = new Shell(this, this.shellFromConfig(size.size))
    shell.launch(size.x, size.height)

    let extraDelay = shell.starLife
    if (shell.fallingLeaves) {
      extraDelay = 4600
    }

    return 900 + Math.random() * 600 + extraDelay
  }

  private seqSmallBarrage = (): number => {
    this.seqSmallBarrageLastCalled = Date.now()
    const IS_DESKTOP = typeof window !== 'undefined' && window.innerWidth > 800
    const barrageCount = IS_DESKTOP ? 11 : 5
    const specialIndex = IS_DESKTOP ? 3 : 1
    const shellSize = Math.max(0, parseFloat(this.config.size) - 2)
    const randomMainShell = Math.random() < 0.78 ? this.crysanthemumShell : this.ringShell
    const fastShellBlacklist = ['Falling Leaves', 'Floral', 'Willow']
    const isRandom = this.config.shell === 'Random'
    let shellName = isRandom ? this.randomShellName() : this.config.shell
    if (isRandom) {
      while (fastShellBlacklist.includes(shellName)) {
        shellName = this.randomShellName()
      }
    }
    const randomSpecialShell = this.shellTypes[shellName]

    const launchShell = (x: number, useSpecial: boolean) => {
      const isRandom = this.config.shell === 'Random'
      const shellType = isRandom
        ? useSpecial
          ? randomSpecialShell
          : randomMainShell
        : this.shellTypes[this.config.shell]
      const shell = new Shell(this, shellType(shellSize))
      const height = (Math.cos(x * 5 * Math.PI + PI_HALF) + 1) / 2
      shell.launch(x, height * 0.75)
    }

    let count = 0
    let delay = 0
    while (count < barrageCount) {
      if (count === 0) {
        launchShell(0.5, false)
        count += 1
      } else {
        const offset = (count + 1) / barrageCount / 2
        const delayOffset = Math.random() * 30 + 30
        const useSpecial = count === specialIndex
        setTimeout(() => {
          launchShell(0.5 + offset, useSpecial)
        }, delay)
        setTimeout(() => {
          launchShell(0.5 - offset, useSpecial)
        }, delay + delayOffset)
        count += 2
      }
      delay += 200
    }

    return 3400 + barrageCount * 120
  }

  private seqTriple = (): number => {
    const fastShellBlacklist = ['Falling Leaves', 'Floral', 'Willow']
    const isRandom = this.config.shell === 'Random'
    let shellName = isRandom ? this.randomShellName() : this.config.shell
    if (isRandom) {
      while (fastShellBlacklist.includes(shellName)) {
        shellName = this.randomShellName()
      }
    }
    const shellType = this.shellTypes[shellName]
    const baseSize = parseFloat(this.config.size)
    const smallSize = Math.max(0, baseSize - 1.25)

    const offset = Math.random() * 0.08 - 0.04
    const shell1 = new Shell(this, shellType(baseSize))
    shell1.launch(0.5 + offset, 0.7)

    const leftDelay = 1000 + Math.random() * 400
    const rightDelay = 1000 + Math.random() * 400

    setTimeout(() => {
      const offset = Math.random() * 0.08 - 0.04
      const shell2 = new Shell(this, shellType(smallSize))
      shell2.launch(0.2 + offset, 0.1)
    }, leftDelay)

    setTimeout(() => {
      const offset = Math.random() * 0.08 - 0.04
      const shell3 = new Shell(this, shellType(smallSize))
      shell3.launch(0.8 + offset, 0.1)
    }, rightDelay)

    return 4000
  }

  private seqTwoRandom = (): number => {
    const size1 = this.getRandomShellSize()
    const size2 = this.getRandomShellSize()
    const shell1 = new Shell(this, this.shellFromConfig(size1.size))
    const shell2 = new Shell(this, this.shellFromConfig(size2.size))
    const leftOffset = Math.random() * 0.2 - 0.1
    const rightOffset = Math.random() * 0.2 - 0.1
    shell1.launch(0.3 + leftOffset, size1.height)
    setTimeout(() => {
      shell2.launch(0.7 + rightOffset, size2.height)
    }, 100)

    let extraDelay = Math.max(shell1.starLife, shell2.starLife)
    if (shell1.fallingLeaves || shell2.fallingLeaves) {
      extraDelay = 4600
    }

    return 900 + Math.random() * 600 + extraDelay
  }

  private setupPointerEvents() {
    this.mainStage.canvas.addEventListener('pointerdown', this.handlePointerStart)
    this.mainStage.canvas.addEventListener('pointerup', this.handlePointerEnd)
    this.mainStage.canvas.addEventListener('pointermove', this.handlePointerMove)
  }

  private shellFromConfig(size: number): ShellOptions {
    const shellName = this.config.shell
    return this.shellTypes[shellName](size)
  }

  private skyLightingSelector(): number {
    return parseInt(this.config.skyLighting)
  }

  private startAnimation() {
    const animate = (timestamp: number) => {
      if (!this.lastFrameTime) this.lastFrameTime = timestamp
      const frameTime = timestamp - this.lastFrameTime
      const lag = Math.min(frameTime / 16.667, 3)

      this.update(frameTime, lag)
      this.lastFrameTime = timestamp

      if (!this.paused) {
        this.animationFrameId = requestAnimationFrame(animate)
      } else {
        this.animationFrameId = null
      }
    }

    this.animationFrameId = requestAnimationFrame(animate)
  }

  private startSequence(): number {
    if (this.isFirstSeq) {
      this.isFirstSeq = false
      const shell = new Shell(this, this.crysanthemumShell(parseFloat(this.config.size)))
      shell.launch(0.5, 0.5)
      return 2400
    }

    if (this.config.finale) {
      this.seqRandomFastShell()
      if (this.currentFinaleCount < this.finaleCount) {
        this.currentFinaleCount++
        return 170
      } else {
        this.currentFinaleCount = 0
        return 6000
      }
    }

    const rand = Math.random()

    // Check if smallBarrage cooldown has passed (15 seconds)
    const smallBarrageCooldown = 15000
    if (rand < 0.08 && Date.now() - this.seqSmallBarrageLastCalled > smallBarrageCooldown) {
      return this.seqSmallBarrage()
    }

    if (rand < 0.1) {
      return this.seqPyramid()
    }

    if (rand < 0.6) {
      return this.seqRandomShell()
    } else if (rand < 0.8) {
      return this.seqTwoRandom()
    } else if (rand < 1) {
      return this.seqTriple()
    }

    return 2000
  }

  private strobeShell = (size = 1): ShellOptions => {
    const color = this.randomColor({ limitWhite: true })
    return {
      shellSize: size,
      spreadSize: 280 + size * 92,
      starLife: 1100 + size * 200,
      starLifeVariation: 0.4,
      starDensity: 1.1,
      color,
      glitter: 'light',
      glitterColor: COLOR.White,
      strobe: true,
      strobeColor: Math.random() < 0.5 ? COLOR.White : undefined,
      pistil: Math.random() < 0.5,
      pistilColor: this.makePistilColor(color),
    }
  }

  private toggleMenu(open?: boolean, notifyCallback = false) {
    const newMenuOpen = open !== undefined ? open : !this.menuOpen
    this.menuOpen = newMenuOpen
    // Pause/resume sound based on menu state
    const canPlaySound = this.isRunning()
    if (canPlaySound) {
      this.soundManager.resumeAll()
    } else {
      this.soundManager.pauseAll()
    }
    // Notify React component only when change originates from engine
    if (notifyCallback && this.onMenuToggle) {
      this.onMenuToggle(newMenuOpen)
    }
  }

  private update(frameTime: number, lag: number) {
    if (!this.isRunning()) return

    const timeStep = frameTime * this.simSpeed
    const speed = this.simSpeed * lag

    this.updateGlobals(timeStep, lag)

    const starDrag = 1 - (1 - this.Star.airDrag) * speed
    const starDragHeavy = 1 - (1 - this.Star.airDragHeavy) * speed
    const sparkDrag = 1 - (1 - this.Spark.airDrag) * speed
    const gAcc = (timeStep / 1000) * GRAVITY

    this.COLOR_CODES_W_INVIS.forEach((color) => {
      const stars = this.Star.active[color]
      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i]
        if (star.updateFrame === this.currentFrame) continue
        star.updateFrame = this.currentFrame

        star.life -= timeStep
        if (star.life <= 0) {
          stars.splice(i, 1)
          this.Star.returnInstance(star)
        } else {
          const burnRate = Math.pow(star.life / star.fullLife, 0.5)
          const burnRateInverse = 1 - burnRate

          star.prevX = star.x
          star.prevY = star.y
          star.x += star.speedX * speed
          star.y += star.speedY * speed

          if (!star.heavy) {
            star.speedX *= starDrag
            star.speedY *= starDrag
          } else {
            star.speedX *= starDragHeavy
            star.speedY *= starDragHeavy
          }
          star.speedY += gAcc

          if (star.spinRadius) {
            star.spinAngle += star.spinSpeed * speed
            star.x += Math.sin(star.spinAngle) * star.spinRadius * speed
            star.y += Math.cos(star.spinAngle) * star.spinRadius * speed
          }

          if (star.sparkFreq) {
            star.sparkTimer -= timeStep
            while (star.sparkTimer < 0) {
              star.sparkTimer += star.sparkFreq * 0.75 + star.sparkFreq * burnRateInverse * 4
              this.Spark.add(
                star.x,
                star.y,
                star.sparkColor,
                Math.random() * PI_2,
                Math.random() * star.sparkSpeed * burnRate,
                star.sparkLife * 0.8 + Math.random() * star.sparkLifeVariation * star.sparkLife,
              )
            }
          }

          if (star.life < star.transitionTime) {
            if (star.secondColor && !star.colorChanged) {
              star.colorChanged = true
              star.color = star.secondColor
              stars.splice(i, 1)
              this.Star.active[star.secondColor].push(star)
              if (star.secondColor === INVISIBLE) {
                star.sparkFreq = 0
              }
            }

            if (star.strobe && star.strobeFreq) {
              star.visible = Math.floor(star.life / star.strobeFreq) % 3 === 0
            }
          }
        }
      }

      const sparks = this.Spark.active[color]
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i]
        spark.life -= timeStep
        if (spark.life <= 0) {
          sparks.splice(i, 1)
          this.Spark.returnInstance(spark)
        } else {
          spark.prevX = spark.x
          spark.prevY = spark.y
          spark.x += spark.speedX * speed
          spark.y += spark.speedY * speed
          spark.speedX *= sparkDrag
          spark.speedY *= sparkDrag
          spark.speedY += gAcc
        }
      }
    })

    this.render(speed)
  }

  private updateGlobals(timeStep: number, lag: number) {
    this.currentFrame++

    if (!this.isUpdatingSpeed) {
      this.speedBarOpacity -= lag / 30
      if (this.speedBarOpacity < 0) {
        this.speedBarOpacity = 0
      }
    }

    if (this.config.autoLaunch) {
      this.autoLaunchTime -= timeStep
      if (this.autoLaunchTime <= 0) {
        this.autoLaunchTime = this.startSequence() * 1.25
      }
    }
  }

  private updateQuality() {
    this.quality = parseInt(this.config.quality)
    this.isLowQuality = this.quality === QUALITY_LOW
    this.isHighQuality = this.quality === QUALITY_HIGH
    this.Spark.drawWidth = this.quality === QUALITY_HIGH ? 0.75 : 1
  }

  private updateSpeedFromEvent(x: number, y: number): boolean {
    const height = this.mainStage.height / this.mainStage.dpr
    const width = this.mainStage.width / this.mainStage.dpr

    // Check if pointer is near bottom of screen (within 44px)
    if (this.isUpdatingSpeed || y >= height - 44) {
      // Padding to make it easier to hit 0 or 1 on phones
      const edge = 16
      const newSpeed = (x - edge) / (width - edge * 2)
      this.simSpeed = Math.min(Math.max(newSpeed, 0), 1)
      this.speedBarOpacity = 1
      return true
    }
    return false
  }

  private whiteOrGold(): string {
    return Math.random() < 0.5 ? COLOR.Gold : COLOR.White
  }

  private willowShell = (size = 1): ShellOptions => ({
    shellSize: size,
    spreadSize: 300 + size * 100,
    starDensity: 0.6,
    starLife: 3000 + size * 300,
    glitter: 'willow',
    glitterColor: COLOR.Gold,
    color: INVISIBLE,
  })
}

// FireworkEngine implementation
export { FireworkEngine }
// Shell class - defined before FireworkEngine implementation
class Shell {
  color: string | 'random' | string[]
  comet: StarInstance | null
  crackle: boolean
  crossette: boolean
  engine: FireworkEngine
  fallingLeaves: boolean
  floral: boolean
  glitter: string
  glitterColor: string
  horsetail: boolean
  pistil: boolean
  pistilColor: string | undefined
  ring: boolean
  secondColor: string | undefined
  shellSize: number
  spreadSize: number
  starCount: number
  starDensity: number
  starLife: number
  starLifeVariation: number
  streamers: boolean
  strobe: boolean
  strobeColor: string | undefined

  constructor(engine: FireworkEngine, options: ShellOptions) {
    this.engine = engine
    this.comet = null
    this.starLifeVariation = options.starLifeVariation || 0.125
    this.color = options.color || engine['randomColor']()
    this.glitterColor = options.glitterColor || (typeof this.color === 'string' ? this.color : COLOR.White)
    this.spreadSize = options.spreadSize || 300
    this.starLife = options.starLife || 900
    this.starDensity = options.starDensity || 1
    this.shellSize = options.shellSize || 1
    this.glitter = options.glitter || ''
    this.pistil = options.pistil || false
    this.pistilColor = options.pistilColor
    this.streamers = options.streamers || false
    this.crossette = options.crossette || false
    this.floral = options.floral || false
    this.crackle = options.crackle || false
    this.fallingLeaves = options.fallingLeaves || false
    this.ring = options.ring || false
    this.horsetail = options.horsetail || false
    this.secondColor = options.secondColor
    this.strobe = options.strobe || false
    this.strobeColor = options.strobeColor

    if (!options.starCount) {
      const density = options.starDensity || 1
      const scaledSize = this.spreadSize / 54
      this.starCount = Math.max(6, scaledSize * scaledSize * density)
    } else {
      this.starCount = options.starCount
    }
  }

  burst(x: number, y: number) {
    const speed = this.spreadSize / 96

    let color: string | null = null
    let onDeath: ((star: StarInstance) => void) | undefined
    let sparkFreq: number | undefined
    let sparkLife: number | undefined
    let sparkSpeed: number | undefined
    let sparkLifeVariation = 0.25
    let playedDeathSound = false

    if (this.crossette)
      onDeath = (star: StarInstance) => {
        if (!playedDeathSound) {
          this.engine['soundManager'].playSound('crackleSmall')
          playedDeathSound = true
        }
        this.engine['crossetteEffect'](star)
      }
    if (this.crackle)
      onDeath = (star: StarInstance) => {
        if (!playedDeathSound) {
          this.engine['soundManager'].playSound('crackle')
          playedDeathSound = true
        }
        this.engine['crackleEffect'](star)
      }
    if (this.floral) onDeath = this.engine['floralEffect']
    if (this.fallingLeaves) onDeath = this.engine['fallingLeavesEffect']

    if (this.glitter === 'light') {
      sparkFreq = 400
      sparkSpeed = 0.3
      sparkLife = 300
      sparkLifeVariation = 2
    } else if (this.glitter === 'medium') {
      sparkFreq = 200
      sparkSpeed = 0.44
      sparkLife = 700
      sparkLifeVariation = 2
    } else if (this.glitter === 'heavy') {
      sparkFreq = 80
      sparkSpeed = 0.8
      sparkLife = 1400
      sparkLifeVariation = 2
    } else if (this.glitter === 'thick') {
      sparkFreq = 16
      sparkSpeed = this.engine['isHighQuality'] ? 1.65 : 1.5
      sparkLife = 1400
      sparkLifeVariation = 3
    } else if (this.glitter === 'streamer') {
      sparkFreq = 32
      sparkSpeed = 1.05
      sparkLife = 620
      sparkLifeVariation = 2
    } else if (this.glitter === 'willow') {
      sparkFreq = 120
      sparkSpeed = 0.34
      sparkLife = 1400
      sparkLifeVariation = 3.8
    }

    if (sparkFreq) {
      sparkFreq = sparkFreq / this.engine['quality']
    }

    const starFactory = (angle: number, speedMult: number) => {
      const standardInitialSpeed = this.spreadSize / 1800

      const star = this.engine['Star'].add(
        x,
        y,
        color || this.engine['randomColor'](),
        angle,
        speedMult * speed,
        this.starLife + Math.random() * this.starLife * this.starLifeVariation,
        this.horsetail ? (this.comet && this.comet.speedX) || 0 : 0,
        this.horsetail ? (this.comet && this.comet.speedY) || -standardInitialSpeed : -standardInitialSpeed,
      )

      if (this.secondColor) {
        star.transitionTime = this.starLife * (Math.random() * 0.05 + 0.32)
        star.secondColor = this.secondColor
      }

      if (this.strobe) {
        star.transitionTime = this.starLife * (Math.random() * 0.08 + 0.46)
        star.strobe = true
        star.strobeFreq = Math.random() * 20 + 40
        if (this.strobeColor) {
          star.secondColor = this.strobeColor
        }
      }

      star.onDeath = onDeath

      if (this.glitter && sparkFreq !== undefined && sparkSpeed !== undefined && sparkLife !== undefined) {
        star.sparkFreq = sparkFreq
        star.sparkSpeed = sparkSpeed
        star.sparkLife = sparkLife
        star.sparkLifeVariation = sparkLifeVariation
        star.sparkColor = this.glitterColor
        star.sparkTimer = Math.random() * star.sparkFreq
      }
    }

    if (typeof this.color === 'string') {
      if (this.color === 'random') {
        color = null
      } else {
        color = this.color
      }

      if (this.ring) {
        const ringStartAngle = Math.random() * Math.PI
        const ringSquash = Math.pow(Math.random(), 2) * 0.85 + 0.15

        this.engine['createParticleArc'](0, PI_2, this.starCount, 0, (angle: number) => {
          const initSpeedX = Math.sin(angle) * speed * ringSquash
          const initSpeedY = Math.cos(angle) * speed
          const newSpeed = MyMath.pointDist(0, 0, initSpeedX, initSpeedY)
          const newAngle = MyMath.pointAngle(0, 0, initSpeedX, initSpeedY) + ringStartAngle
          const star = this.engine['Star'].add(
            x,
            y,
            color || this.engine['randomColor'](),
            newAngle,
            newSpeed,
            this.starLife + Math.random() * this.starLife * this.starLifeVariation,
          )

          if (this.glitter && sparkFreq !== undefined && sparkSpeed !== undefined && sparkLife !== undefined) {
            star.sparkFreq = sparkFreq
            star.sparkSpeed = sparkSpeed
            star.sparkLife = sparkLife
            star.sparkLifeVariation = sparkLifeVariation
            star.sparkColor = this.glitterColor
            star.sparkTimer = Math.random() * star.sparkFreq
          }
        })
      } else {
        this.engine['createBurst'](this.starCount, starFactory)
      }
    } else if (Array.isArray(this.color)) {
      if (Math.random() < 0.5) {
        const start = Math.random() * Math.PI
        const start2 = start + Math.PI
        const arc = Math.PI
        color = this.color[0]
        this.engine['createBurst'](this.starCount, starFactory, start, arc)
        color = this.color[1]
        this.engine['createBurst'](this.starCount, starFactory, start2, arc)
      } else {
        color = this.color[0]
        this.engine['createBurst'](this.starCount / 2, starFactory)
        color = this.color[1]
        this.engine['createBurst'](this.starCount / 2, starFactory)
      }
    }

    if (this.pistil) {
      const innerShell = new Shell(this.engine, {
        spreadSize: this.spreadSize * 0.5,
        starLife: this.starLife * 0.6,
        starLifeVariation: this.starLifeVariation,
        starDensity: 1.4,
        color: this.pistilColor,
        glitter: 'light',
        glitterColor: this.pistilColor === COLOR.Gold ? COLOR.Gold : COLOR.White,
      })
      innerShell.burst(x, y)
    }

    if (this.streamers) {
      const innerShell = new Shell(this.engine, {
        spreadSize: this.spreadSize * 0.9,
        starLife: this.starLife * 0.8,
        starLifeVariation: this.starLifeVariation,
        starCount: Math.floor(Math.max(6, this.spreadSize / 45)),
        color: COLOR.White,
        glitter: 'streamer',
      })
      innerShell.burst(x, y)
    }

    this.engine['BurstFlash'].add(x, y, this.spreadSize / 4)

    if (this.comet) {
      const maxDiff = 2
      const sizeDifferenceFromMaxSize = Math.min(maxDiff, parseFloat(this.engine['config'].size) - this.shellSize)
      const soundScale = (1 - sizeDifferenceFromMaxSize / maxDiff) * 0.3 + 0.7
      this.engine['soundManager'].playSound('burst', soundScale)
    }
  }

  launch(position: number, launchHeight: number) {
    const width = this.engine['stageW']
    const height = this.engine['stageH']
    const hpad = 60
    const vpad = 50
    const minHeightPercent = 0.45
    const minHeight = height - height * minHeightPercent

    const launchX = position * (width - hpad * 2) + hpad
    const launchY = height
    const burstY = minHeight - launchHeight * (minHeight - vpad)

    const launchDistance = launchY - burstY
    const launchVelocity = Math.pow(launchDistance * 0.04, 0.64)

    const comet = (this.comet = this.engine['Star'].add(
      launchX,
      launchY,
      typeof this.color === 'string' && this.color !== 'random' ? this.color : COLOR.White,
      Math.PI,
      launchVelocity * (this.horsetail ? 1.2 : 1),
      launchVelocity * (this.horsetail ? 100 : 400),
    ))

    comet.heavy = true
    comet.spinRadius = MyMath.random(0.32, 0.85)
    comet.sparkFreq = 32 / this.engine['quality']
    if (this.engine['isHighQuality']) comet.sparkFreq = 8
    comet.sparkLife = 320
    comet.sparkLifeVariation = 3
    if (this.glitter === 'willow' || this.fallingLeaves) {
      comet.sparkFreq = 20 / this.engine['quality']
      comet.sparkSpeed = 0.5
      comet.sparkLife = 500
    }
    if (this.color === INVISIBLE) {
      comet.sparkColor = COLOR.Gold
    }

    if (Math.random() > 0.4 && !this.horsetail) {
      comet.secondColor = INVISIBLE
      comet.transitionTime = Math.pow(Math.random(), 1.5) * 700 + 500
    }

    comet.onDeath = () => this.burst(comet.x, comet.y)

    this.engine['soundManager'].playSound('lift')
  }
}
