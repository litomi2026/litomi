'use client'

import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { FireworkEngine } from './FireworkEngine'
import PauseButton from './FireworkPauseButton'
import SoundButton from './FireworkSoundButton'
import { FireworkConfig } from './types'

interface FireworkProps {
  className?: string
  config: FireworkConfig
}

// https://codepen.io/MillerTime/pen/XgpNwb
export default function Firework({ config: initialConfig, className = '' }: FireworkProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [helpTopic, setHelpTopic] = useState<string | null>(null)
  const [config, setConfig] = useState<FireworkConfig>(getDefaultConfig(initialConfig))
  const stageContainerRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const trailsCanvasRef = useRef<HTMLCanvasElement>(null)
  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<FireworkEngine | null>(null)

  function toggleFullscreen() {
    if (typeof document === 'undefined') {
      return
    }

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  function handleToggleMenu(open: boolean) {
    setMenuOpen(open)
    if (engineRef.current) {
      engineRef.current.setMenuOpen(open)
    }
  }

  useEffect(() => {
    if (!trailsCanvasRef.current || !mainCanvasRef.current || !canvasContainerRef.current) {
      return
    }

    const engine = new FireworkEngine({
      trailsCanvas: trailsCanvasRef.current,
      mainCanvas: mainCanvasRef.current,
      config,
      onMenuToggle: (menuOpen) => setMenuOpen(menuOpen),
    })

    engine.setCanvasContainer(canvasContainerRef.current)
    engineRef.current = engine

    engine
      .init()
      .then(() => {
        setIsLoading(false)
        engine.togglePause(false)
        if (config.soundEnabled) {
          engine.toggleSound(true)
        }
      })
      .catch((error: Error) => {
        console.error('Failed to initialize firework engine:', error)
        setIsLoading(false)
        engine.togglePause(false)
      })

    return () => {
      engine.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateConfig(config)
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'cm_fireworks_data',
        JSON.stringify({
          schemaVersion: '1.2',
          data: {
            quality: config.quality,
            size: config.size,
            skyLighting: config.skyLighting,
            scaleFactor: config.scaleFactor,
          },
        }),
      )
    }
  }, [config])

  // Fullscreen handling
  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <div className={twMerge('relative overflow-hidden bg-black', className)} ref={stageContainerRef}>
      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <div className="text-center uppercase text-white/50">
            <div className="text-4xl">Loading</div>
            <div className="mt-4 text-sm opacity-75">Assembling Shells</div>
          </div>
        </div>
      )}
      {/* Canvas Container */}
      <div
        aria-current={!menuOpen}
        className="h-full w-full transition blur aria-current:blur-none"
        ref={canvasContainerRef}
      >
        <canvas
          className="absolute mix-blend-lighten transform-[translateZ(0)]"
          id="trails-canvas"
          ref={trailsCanvasRef}
        />
        <canvas className="absolute mix-blend-lighten transform-[translateZ(0)]" id="main-canvas" ref={mainCanvasRef} />
      </div>
      {/* Controls */}
      <div
        aria-hidden={menuOpen || config.hideControls}
        className="absolute left-0 right-0 top-0 z-50 flex justify-between pb-12 transition aria-hidden:pointer-events-none aria-hidden:invisible aria-hidden:opacity-0 lg:aria-hidden:hover:visible lg:aria-hidden:hover:opacity-100"
      >
        <PauseButton engineRef={engineRef} isLoading={isLoading} />
        <SoundButton engineRef={engineRef} isLoading={isLoading} />
        <button
          aria-label="Settings"
          className="flex size-12 cursor-default select-none opacity-[0.16] transition lg:hover:opacity-[0.32]"
          onClick={() => handleToggleMenu(!menuOpen)}
          type="button"
        >
          <svg className="m-auto" fill="white" height="24" width="24">
            <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
          </svg>
        </button>
      </div>

      {/* Settings Menu */}
      {menuOpen && (
        <div className="absolute inset-0 z-40 bg-black/40">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <button
              aria-label="Close"
              className="absolute right-0 top-0 flex size-12 select-none opacity-50 transition lg:hover:opacity-75"
              onClick={() => handleToggleMenu(false)}
              type="button"
            >
              <svg className="m-auto" fill="white" height="24" width="24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            <div className="mb-2 mt-auto pt-4 text-3xl text-white/50">설정</div>
            <div className="mb-auto pb-3 text-sm text-white/50 opacity-80">자세한 정보는 라벨을 클릭하세요</div>
            <form
              className="w-full max-w-[400px] overflow-auto px-2.5 transition"
              style={{ opacity: helpTopic ? 0.12 : 1, WebkitOverflowScrolling: 'touch' }}
            >
              {/* Shell Type */}
              <div className="my-4 flex items-center">
                <label
                  className="w-1/2 select-none pr-3 text-right uppercase text-white/50 cursor-pointer"
                  onClick={() => setHelpTopic('shellType')}
                >
                  Shell Type
                </label>
                <select
                  className="h-[30px] w-1/2 border border-white/50 bg-transparent text-base text-white/50"
                  onChange={(e) => setConfig({ ...config, shell: e.target.value })}
                  value={config.shell}
                >
                  <option className="bg-black" value="Random">
                    Random
                  </option>
                  <option className="bg-black" value="Crackle">
                    Crackle
                  </option>
                  <option className="bg-black" value="Crossette">
                    Crossette
                  </option>
                  <option className="bg-black" value="Crysanthemum">
                    Crysanthemum
                  </option>
                  <option className="bg-black" value="Falling Leaves">
                    Falling Leaves
                  </option>
                  <option className="bg-black" value="Floral">
                    Floral
                  </option>
                  <option className="bg-black" value="Ghost">
                    Ghost
                  </option>
                  <option className="bg-black" value="Horse Tail">
                    Horse Tail
                  </option>
                  <option className="bg-black" value="Palm">
                    Palm
                  </option>
                  <option className="bg-black" value="Ring">
                    Ring
                  </option>
                  <option className="bg-black" value="Strobe">
                    Strobe
                  </option>
                  <option className="bg-black" value="Willow">
                    Willow
                  </option>
                </select>
              </div>
              {/* Shell Size */}
              <div className="my-4 flex items-center">
                <label
                  className="w-1/2 select-none pr-3 text-right uppercase text-white/50 cursor-pointer"
                  onClick={() => setHelpTopic('shellSize')}
                >
                  Shell Size
                </label>
                <select
                  className="h-[30px] w-1/2 border border-white/50 bg-transparent text-base text-white/50"
                  onChange={(e) => setConfig({ ...config, size: e.target.value })}
                  value={config.size}
                >
                  <option className="bg-black" value="0">
                    3&quot;
                  </option>
                  <option className="bg-black" value="1">
                    4&quot;
                  </option>
                  <option className="bg-black" value="2">
                    6&quot;
                  </option>
                  <option className="bg-black" value="3">
                    8&quot;
                  </option>
                  <option className="bg-black" value="4">
                    12&quot;
                  </option>
                  <option className="bg-black" value="5">
                    16&quot;
                  </option>
                </select>
              </div>
              {/* Quality */}
              <div className="my-4 flex items-center">
                <label
                  className="w-1/2 select-none pr-3 text-right uppercase text-white/50 cursor-pointer"
                  onClick={() => setHelpTopic('quality')}
                >
                  Quality
                </label>
                <select
                  className="h-[30px] w-1/2 border border-white/50 bg-transparent text-base text-white/50"
                  onChange={(e) => setConfig({ ...config, quality: e.target.value })}
                  value={config.quality}
                >
                  <option className="bg-black" value="1">
                    Low
                  </option>
                  <option className="bg-black" value="2">
                    Normal
                  </option>
                  <option className="bg-black" value="3">
                    High
                  </option>
                </select>
              </div>
              {/* Sky Lighting */}
              <div className="my-4 flex items-center">
                <label
                  className="w-1/2 select-none pr-3 text-right uppercase text-white/50 cursor-pointer"
                  onClick={() => setHelpTopic('skyLighting')}
                >
                  Sky Lighting
                </label>
                <select
                  className="h-[30px] w-1/2 border border-white/50 bg-transparent text-base text-white/50"
                  onChange={(e) => setConfig({ ...config, skyLighting: e.target.value })}
                  value={config.skyLighting}
                >
                  <option className="bg-black" value="0">
                    None
                  </option>
                  <option className="bg-black" value="1">
                    Dim
                  </option>
                  <option className="bg-black" value="2">
                    Normal
                  </option>
                </select>
              </div>
              {/* Scale */}
              <div className="my-4 flex items-center">
                <label
                  className="w-1/2 select-none pr-3 text-right uppercase text-white/50 cursor-pointer"
                  onClick={() => setHelpTopic('scaleFactor')}
                >
                  Scale
                </label>
                <select
                  className="h-[30px] w-1/2 border border-white/50 bg-transparent text-base text-white/50"
                  onChange={(e) => setConfig({ ...config, scaleFactor: parseFloat(e.target.value) })}
                  value={config.scaleFactor.toFixed(2)}
                >
                  <option className="bg-black" value="0.50">
                    50%
                  </option>
                  <option className="bg-black" value="0.62">
                    62%
                  </option>
                  <option className="bg-black" value="0.75">
                    75%
                  </option>
                  <option className="bg-black" value="0.90">
                    90%
                  </option>
                  <option className="bg-black" value="1.00">
                    100%
                  </option>
                  <option className="bg-black" value="1.50">
                    150%
                  </option>
                  <option className="bg-black" value="2.00">
                    200%
                  </option>
                </select>
              </div>
              {/* Checkboxes */}
              <div className="my-4 flex items-center">
                <label
                  className="w-1/2 select-none pr-3 text-right uppercase text-white/50 cursor-pointer"
                  onClick={() => setHelpTopic('autoLaunch')}
                >
                  Auto Fire
                </label>
                <input
                  checked={config.autoLaunch}
                  className="h-[26px] w-[26px] opacity-50"
                  onChange={(e) => setConfig({ ...config, autoLaunch: e.target.checked })}
                  type="checkbox"
                />
              </div>
              <div className="my-4 flex items-center transition" style={{ opacity: config.autoLaunch ? 1 : 0.32 }}>
                <label
                  className="w-1/2 select-none pr-3 text-right uppercase text-white/50 cursor-pointer"
                  onClick={() => setHelpTopic('finaleMode')}
                >
                  Finale Mode
                </label>
                <input
                  checked={config.finale}
                  className="h-[26px] w-[26px] opacity-50"
                  disabled={!config.autoLaunch}
                  onChange={(e) => setConfig({ ...config, finale: e.target.checked })}
                  type="checkbox"
                />
              </div>
              <div className="my-4 flex items-center">
                <label
                  className="w-1/2 select-none pr-3 text-right uppercase text-white/50 cursor-pointer"
                  onClick={() => setHelpTopic('hideControls')}
                >
                  Hide Controls
                </label>
                <input
                  checked={config.hideControls}
                  className="h-[26px] w-[26px] opacity-50"
                  onChange={(e) => setConfig({ ...config, hideControls: e.target.checked })}
                  type="checkbox"
                />
              </div>
              <div className="my-4 flex items-center">
                <label
                  className="w-1/2 select-none pr-3 text-right uppercase text-white/50 cursor-pointer"
                  onClick={() => setHelpTopic('fullscreen')}
                >
                  Fullscreen
                </label>
                <input
                  checked={isFullscreen}
                  className="h-[26px] w-[26px] opacity-50"
                  onChange={toggleFullscreen}
                  type="checkbox"
                />
              </div>
              <div className="my-4 flex items-center">
                <label
                  className="w-1/2 select-none pr-3 text-right uppercase text-white/50 cursor-pointer"
                  onClick={() => setHelpTopic('longExposure')}
                >
                  Open Shutter
                </label>
                <input
                  checked={config.longExposure}
                  className="h-[26px] w-[26px] opacity-50"
                  onChange={(e) => setConfig({ ...config, longExposure: e.target.checked })}
                  type="checkbox"
                />
              </div>
            </form>
            <div className="mb-2.5 mt-auto pt-1.5 text-[0.8em] text-white/50 opacity-75">
              Passionately built by{' '}
              <a
                className="text-white/50 no-underline transition lg:hover:text-white/75 lg:hover:underline"
                href="https://cmiller.tech/"
                rel="noopener"
                target="_blank"
              >
                Caleb Miller
              </a>
              .
            </div>
          </div>
        </div>
      )}
      {/* Help Modal */}
      {helpTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setHelpTopic(null)} />
          <div className="relative m-2.5 flex max-h-[calc(100vh-100px)] w-full max-w-[400px] flex-col items-center rounded bg-black/40 p-5 lg:max-w-[500px] lg:text-xl">
            <div className="text-center text-3xl uppercase text-white/50">
              {helpContent[helpTopic as keyof typeof helpContent]?.header}
            </div>
            <div
              className="my-4 overflow-y-auto border-b border-t border-white/25 py-4 text-white/75"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {helpContent[helpTopic as keyof typeof helpContent]?.body}
            </div>
            <button
              className="mt-4 shrink-0 rounded bg-brand p-3 py-1 text-background text-sm font-bold"
              onClick={() => setHelpTopic(null)}
              type="button"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const helpContent = {
  shellType: {
    header: '불꽃 종류',
    body: '발사될 불꽃의 종류입니다. 다양한 불꽃을 보려면 "Random"을 선택하세요!',
  },
  shellSize: {
    header: '불꽃 크기',
    body: '불꽃의 크기입니다. 실제 불꽃 크기를 기반으로 제작되었으며, 큰 불꽃일수록 더 많은 별과 복잡한 효과를 가집니다. 다만, 큰 불꽃은 더 많은 처리 성능을 요구하여 지연이 발생할 수 있습니다.',
  },
  quality: {
    header: '화질',
    body: '전체 그래픽 품질입니다. 애니메이션이 원활하게 실행되지 않으면 품질을 낮춰보세요. 높은 품질은 렌더링되는 불꽃 입자 수를 크게 증가시켜 지연이 발생할 수 있습니다.',
  },
  skyLighting: {
    header: '하늘 조명',
    body: '불꽃이 터질 때 배경을 밝힙니다. 화면이 너무 밝게 보이면 "Dim" 또는 "None"으로 설정하세요.',
  },
  scaleFactor: {
    header: '배율',
    body: '모든 불꽃의 크기를 조정하여, 본질적으로 더 가까이 또는 멀리 이동할 수 있습니다. 큰 불꽃 크기의 경우, 특히 휴대폰이나 태블릿에서는 배율을 약간 줄이는 것이 편리합니다.',
  },
  autoLaunch: {
    header: '자동 발사',
    body: '불꽃을 자동으로 연속 발사합니다. 편안히 쇼를 즐기거나, 비활성화하여 완전히 제어하세요.',
  },
  finaleMode: {
    header: '피날레 모드',
    body: '강렬한 불꽃을 연속으로 발사합니다. 지연이 발생할 수 있습니다. "자동 발사"가 활성화되어 있어야 합니다.',
  },
  hideControls: {
    header: '컨트롤 숨기기',
    body: '화면 상단의 반투명 컨트롤을 숨깁니다. 스크린샷이나 더욱 몰입감 있는 경험에 유용합니다. 숨겨진 상태에서도 우측 상단을 탭하여 메뉴를 다시 열 수 있습니다.',
  },
  fullscreen: {
    header: '전체 화면',
    body: '전체 화면 모드를 전환합니다.',
  },
  longExposure: {
    header: '오픈 셔터',
    body: '카메라 셔터를 열어둔 것처럼 긴 빛의 궤적을 보존하는 실험적인 효과입니다.',
  },
}

function getDefaultConfig({ autoLaunch, quality, soundEnabled }: FireworkConfig) {
  if (typeof window !== 'undefined') {
    try {
      const saved = sessionStorage.getItem('cm_fireworks_data')
      if (saved) {
        const { schemaVersion, data } = JSON.parse(saved)
        if (schemaVersion === '1.2') {
          return {
            quality: data.quality || quality,
            shell: 'Random',
            size: data.size || '3',
            autoLaunch,
            finale: true,
            skyLighting: data.skyLighting || '2',
            hideControls: false,
            longExposure: false,
            scaleFactor: data.scaleFactor || 1.0,
            soundEnabled,
          }
        }
      }
    } catch (e) {
      console.error('Failed to load saved config:', e)
    }
  }
  return {
    quality,
    shell: 'Random',
    size: '3',
    autoLaunch,
    finale: true,
    skyLighting: '2',
    hideControls: false,
    longExposure: false,
    scaleFactor: 1.0,
    soundEnabled,
  }
}
