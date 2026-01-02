import { MapPin } from 'lucide-react'
import { toast } from 'sonner'

import PostBaseButton from './PostBaseButton'

type Props = {
  disabled: boolean
  onLocationChange: (geolocation: { lat: number; lon: number }) => void
}

export default function PostGeolocationButton({ disabled, onLocationChange }: Readonly<Props>) {
  function handleClick() {
    if (!navigator.geolocation) {
      toast.warning('위치 정보를 가져올 수 없어요')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onLocationChange({ lat: latitude, lon: longitude })
        toast.warning('위치 기능은 현재 지원하지 않아요')
      },
      (error) => {
        console.warn(error)
        toast.warning('위치 정보를 가져올 수 없어요')
      },
    )
  }

  return (
    <PostBaseButton disabled={disabled} onClick={handleClick}>
      <input className="hidden" disabled={disabled} />
      <MapPin className="w-5" />
    </PostBaseButton>
  )
}
