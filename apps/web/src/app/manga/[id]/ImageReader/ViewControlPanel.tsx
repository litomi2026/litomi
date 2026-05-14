'use client'

import { Monitor, Palette, ZoomIn } from 'lucide-react'
import { useEffect, useState } from 'react'

import Slider from '@/components/ui/Slider'

import { DEFAULT_ZOOM, MAX_ZOOM, useReaderSessionStore, useReaderStore } from './store/reader'

const CONTROL_ICONS_CLASS = 'size-4 text-zinc-400'
const CONTROL_LABEL_CLASS = 'text-xs text-zinc-400 font-medium min-w-8 text-right'

type Props = {
  id?: string
}

export default function ViewControlPanel({ id }: Props) {
  const brightness = useReaderSessionStore((state) => state.brightness)
  const imageWidth = useReaderStore((state) => state.imageWidth)
  const zoomLevel = useReaderSessionStore((state) => state.zoomLevel)
  const isWidthControlEnabled = useReaderStore((state) => state.screenFit === 'all' || state.screenFit === 'width')
  const setBrightness = useReaderSessionStore((state) => state.setBrightness)
  const setImageWidth = useReaderStore((state) => state.setImageWidth)
  const setZoomLevel = useReaderSessionStore((state) => state.setZoomLevel)
  const [localBrightness, setLocalBrightness] = useState(brightness)
  const [localWidth, setLocalWidth] = useState(imageWidth)
  const [localZoom, setLocalZoom] = useState(zoomLevel)

  useEffect(() => {
    setLocalBrightness(brightness)
  }, [brightness])

  useEffect(() => {
    setLocalWidth(imageWidth)
  }, [imageWidth])

  useEffect(() => {
    setLocalZoom(zoomLevel)
  }, [zoomLevel])

  return (
    <fieldset
      className="fixed sm:absolute bottom-20 sm:bottom-full inset-x-4 sm:inset-x-auto sm:mb-2 left-1/2 -translate-x-1/2 z-30 m-0 min-w-0 w-[calc(100vw-2rem)] max-w-sm border-0 p-0"
      id={id}
    >
      <legend className="sr-only">보기 조절</legend>
      <div className="bg-zinc-900/95 border border-zinc-700 rounded-xl shadow-xl p-3 sm:p-4">
        <div className="grid gap-3 sm:gap-4">
          <div className="flex items-center gap-3.5">
            <Palette className={CONTROL_ICONS_CLASS} />
            <Slider
              aria-label="밝기"
              aria-valuetext={`${localBrightness}%`}
              className="flex-1 h-4"
              max={100}
              min={10}
              onChange={(value) => setLocalBrightness(value as number)}
              onValueCommit={setBrightness}
              step={10}
              value={localBrightness}
            />
            <span className={CONTROL_LABEL_CLASS}>{localBrightness}%</span>
          </div>

          {isWidthControlEnabled && (
            <div className="flex items-center gap-3.5">
              <Monitor className={CONTROL_ICONS_CLASS} />
              <Slider
                aria-label="이미지 너비"
                aria-valuetext={`${localWidth}%`}
                className="flex-1 h-4"
                max={100}
                min={10}
                onChange={(value) => setLocalWidth(value as 100 | 30 | 50 | 70)}
                onValueCommit={(value) => setImageWidth(value as 100 | 30 | 50 | 70)}
                step={10}
                value={localWidth}
              />
              <span className={CONTROL_LABEL_CLASS}>{localWidth}%</span>
            </div>
          )}

          <div className="flex items-center gap-3.5">
            <ZoomIn className={CONTROL_ICONS_CLASS} />
            <Slider
              aria-label="확대"
              aria-valuetext={`${localZoom.toFixed(1)}배`}
              className="flex-1 h-4"
              max={MAX_ZOOM * 10}
              min={DEFAULT_ZOOM * 10}
              onChange={(value) => setLocalZoom((value as number) / 10)}
              onValueCommit={(value) => setZoomLevel((value as number) / 10)}
              step={5}
              value={Math.round(localZoom * 10)}
            />
            <span className={CONTROL_LABEL_CLASS}>{localZoom.toFixed(1)}x</span>
          </div>
        </div>

        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-zinc-800 text-foreground">
          <div className="flex justify-between gap-1.5 sm:gap-2">
            <button
              className="text-xs px-2 sm:px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition flex-1"
              onClick={() => {
                setBrightness(100)
                setLocalBrightness(100)
              }}
              type="button"
            >
              밝게
            </button>
            <button
              className="text-xs px-2 sm:px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition flex-1"
              onClick={() => {
                setBrightness(50)
                setLocalBrightness(50)
              }}
              type="button"
            >
              어둡게
            </button>
            <button
              className="text-xs px-2 sm:px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition flex-1"
              onClick={() => {
                setBrightness(100)
                setLocalBrightness(100)
                if (isWidthControlEnabled) {
                  setImageWidth(100)
                  setLocalWidth(100)
                }
                setZoomLevel(DEFAULT_ZOOM)
                setLocalZoom(DEFAULT_ZOOM)
              }}
              type="button"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </fieldset>
  )
}
