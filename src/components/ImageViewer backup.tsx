/* eslint-disable @next/next/no-img-element */
'use client'

import { BASE_URL } from '@/constants/url'
import useImageNavigation from '@/hook/useImageNavigation'
import { type Manga } from '@/types/manga'
import { useState } from 'react'

import useNavigationTouchArea from '../hook/useNavigationTouchArea'

type Props = {
  manga: Manga
}

export default function ImageViewer({ manga }: Props) {
  const { id, images } = manga
  const maxIndex = images.length - 1

  // 페이지 레이아웃: 한쪽 보기 vs 두쪽 보기
  const [pageMode, setPageMode] = useState<'double' | 'single'>('single')
  // 네비게이션 방식: 터치 뷰 vs 스크롤 뷰
  const [navMode, setNavMode] = useState<'scroll' | 'touch'>('touch')
  // 이미지 맞춤: width(한번에 보이는 이미지의 가로 100%) vs height(한번에 보이는 이미지의 세로 100%)
  const [imageFit, setImageFit] = useState<'height' | 'width'>('width')
  // 터치 영역 방향 (터치뷰일 때만 적용)
  // const [touchOrientation, setTouchOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  // 페이지 정보 오버레이 노출 여부 (터치모드일 때만)
  const [showInfo, setShowInfo] = useState(false)

  const { currentIndex, prevPage, nextPage } = useImageNavigation({
    maxIndex,
    offset: pageMode === 'double' ? 2 : 1,
  })

  const { touchOrientation, setTouchOrientation, NavigationTouchArea } = useNavigationTouchArea({
    onNext: nextPage,
    onPrev: prevPage,
  })

  // useEffect(() => {
  //   document.body.style.overflow = 'hidden'
  //   return () => {
  //     document.body.style.overflow = 'auto'
  //   }
  // }, [])

  // 이미지 자체 클래스: fit 값에 따라 적용
  const getImageClass = () => {
    return imageFit === 'width' ? 'w-full h-auto object-contain' : 'h-full w-auto object-contain'
  }

  // 이미지 컨테이너 클래스 (double 모드 용): 단일/두쪽 보기 및 fit에 따라 달라짐
  // single 모드에서는 별도 처리를 함
  const getContainerClass = (isDouble: boolean) => {
    if (imageFit === 'width') {
      return isDouble ? 'w-1/2' : 'w-full'
    } else {
      // height fit: 컨테이너의 높이를 뷰포트 높이(h-dvh)로 고정
      return isDouble ? 'h-dvh w-1/2' : 'h-dvh w-full'
    }
  }

  // 터치 모드 이미지 렌더링
  const renderTouchImages = () => {
    if (pageMode === 'single') {
      // single page일 때 상하좌우 중앙 정렬 및 (width 모드 시) 오버플로우 시 스크롤 가능하도록 처리
      return (
        <div className="w-full h-dvh flex items-center justify-center overflow-auto">
          <img
            alt={`manga-image-${currentIndex + 1}`}
            className={getImageClass()}
            onClick={() => setShowInfo((prev) => !prev)}
            referrerPolicy="no-referrer"
            src={`${BASE_URL}/${id}/${images[currentIndex].name}`}
          />
        </div>
      )
    } else {
      // 두쪽보기: 기존과 동일하게 처리
      return (
        <div className="flex gap-2 justify-center">
          <div className={getContainerClass(true)}>
            <img
              alt={`manga-image-${currentIndex + 1}`}
              className={getImageClass()}
              onClick={() => setShowInfo((prev) => !prev)}
              referrerPolicy="no-referrer"
              src={`${BASE_URL}/${id}/${images[currentIndex].name}`}
            />
          </div>
          {currentIndex + 1 <= maxIndex && (
            <div className={getContainerClass(true)}>
              <img
                alt={`manga-image-${currentIndex + 2}`}
                className={getImageClass()}
                onClick={() => setShowInfo((prev) => !prev)}
                referrerPolicy="no-referrer"
                src={`${BASE_URL}/${id}/${images[currentIndex + 1].name}`}
              />
            </div>
          )}
        </div>
      )
    }
  }

  // 스크롤 모드 이미지 렌더링
  const renderScrollImages = () => {
    if (pageMode === 'single') {
      return images.map((img, index) => (
        <div className={`${getContainerClass(false)} my-2 mx-auto`} key={index}>
          <img
            alt={`manga-image-${index + 1}`}
            className={getImageClass()}
            onClick={() => setShowInfo((prev) => !prev)}
            referrerPolicy="no-referrer"
            src={`${BASE_URL}/${id}/${img.name}`}
          />
        </div>
      ))
    } else {
      const groups = []
      for (let i = 0; i < images.length; i += 2) {
        groups.push(
          <div className="flex gap-2 justify-center my-2" key={i}>
            <div className={getContainerClass(true)}>
              <img
                alt={`manga-image-${i + 1}`}
                className={getImageClass()}
                onClick={() => setShowInfo((prev) => !prev)}
                referrerPolicy="no-referrer"
                src={`${BASE_URL}/${id}/${images[i].name}`}
              />
            </div>
            {i + 1 < images.length && (
              <div className={getContainerClass(true)}>
                <img
                  alt={`manga-image-${i + 2}`}
                  className={getImageClass()}
                  onClick={() => setShowInfo((prev) => !prev)}
                  referrerPolicy="no-referrer"
                  src={`${BASE_URL}/${id}/${images[i + 1].name}`}
                />
              </div>
            )}
          </div>,
        )
      }
      return groups
    }
  }

  // 외부 컨테이너 클래스: single + touch + width 모드일 경우 스크롤 가능하도록 처리
  const outerContainerClass =
    navMode === 'touch'
      ? pageMode === 'single' && imageFit === 'width'
        ? 'relative h-dvh overflow-auto'
        : 'relative h-dvh overflow-hidden'
      : 'relative overflow-auto'

  return (
    <div className={outerContainerClass}>
      {/* 옵션 토글 툴바 */}
      <div className="fixed top-2 left-2 z-50 flex flex-col gap-2">
        {/* 페이지 레이아웃 토글 */}
        <div className="flex gap-2">
          <button
            className={`px-2 py-1 rounded ${
              pageMode === 'single' ? 'bg-gray-800 text-white' : 'bg-gray-300 text-black'
            }`}
            onClick={() => setPageMode('single')}
          >
            Single Page
          </button>
          <button
            className={`px-2 py-1 rounded ${
              pageMode === 'double' ? 'bg-gray-800 text-white' : 'bg-gray-300 text-black'
            }`}
            onClick={() => setPageMode('double')}
          >
            Double Page
          </button>
        </div>
        {/* 네비게이션 방식 토글 */}
        <div className="flex gap-2">
          <button
            className={`px-2 py-1 rounded ${navMode === 'touch' ? 'bg-gray-800 text-white' : 'bg-gray-300 text-black'}`}
            onClick={() => setNavMode('touch')}
          >
            Touch Navigation
          </button>
          <button
            className={`px-2 py-1 rounded ${
              navMode === 'scroll' ? 'bg-gray-800 text-white' : 'bg-gray-300 text-black'
            }`}
            onClick={() => setNavMode('scroll')}
          >
            Scroll Navigation
          </button>
        </div>
        {/* 터치 모드일 때 터치 영역 토글 */}
        {navMode === 'touch' && (
          <div className="flex gap-2">
            <button
              aria-pressed={touchOrientation === 'horizontal'}
              className="px-2 py-1 rounded bg-gray-300 text-black aria-pressed:bg-gray-800 aria-pressed:text-white"
              onClick={() => setTouchOrientation('horizontal')}
            >
              Touch: horizontal
            </button>
            <button
              aria-pressed={touchOrientation === 'vertical'}
              className="px-2 py-1 rounded bg-gray-300 text-black aria-pressed:bg-gray-800 aria-pressed:text-white"
              onClick={() => setTouchOrientation('vertical')}
            >
              Touch: vertical
            </button>
          </div>
        )}
        {/* 이미지 크기 맞춤 토글 */}
        <div className="flex gap-2">
          <button
            className={`px-2 py-1 rounded ${
              imageFit === 'width' ? 'bg-gray-800 text-white' : 'bg-gray-300 text-black'
            }`}
            onClick={() => setImageFit('width')}
          >
            Fit: Width
          </button>
          <button
            className={`px-2 py-1 rounded ${
              imageFit === 'height' ? 'bg-gray-800 text-white' : 'bg-gray-300 text-black'
            }`}
            onClick={() => setImageFit('height')}
          >
            Fit: Height
          </button>
        </div>
      </div>

      {/* 페이지 정보 오버레이 (터치 모드에서만, 선택 시 표시) */}
      {showInfo && navMode === 'touch' && (
        <div className="fixed bg-black rounded px-2 top-0 left-1/2 -translate-x-1/2 text-white">
          {currentIndex + 1} / {maxIndex + 1}
        </div>
      )}

      {/* 이미지 렌더링 */}
      {navMode === 'touch' ? renderTouchImages() : renderScrollImages()}

      {/* 터치 내비게이션 오버레이 */}
      {navMode === 'touch' && <NavigationTouchArea />}
    </div>
  )
}
