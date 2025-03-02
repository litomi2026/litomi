import { useState } from 'react'

type Props = {
  onPrev: () => void
  onNext: () => void
}

export default function useNavigationTouchArea({ onNext, onPrev }: Props) {
  const [touchOrientation, setTouchOrientation] = useState<'horizontal' | 'vertical'>('horizontal')

  const renderNavigationTouchArea = () => {
    if (touchOrientation === 'horizontal') {
      return (
        <>
          <div className="absolute left-0 top-0 h-full w-1/3 cursor-pointer" onClick={onPrev} />
          <div className="absolute right-0 top-0 h-full w-1/3 cursor-pointer" onClick={onNext} />
        </>
      )
    } else {
      return (
        <>
          <div className="absolute top-0 left-0 w-full h-1/3 cursor-pointer" onClick={onPrev} />
          <div className="absolute bottom-0 left-0 w-full h-1/3 cursor-pointer" onClick={onNext} />
        </>
      )
    }
  }

  return {
    touchOrientation,
    setTouchOrientation,
    renderNavigationTouchArea,
  }
}
