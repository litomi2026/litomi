import { MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import PostBaseButton from './PostBaseButton'

type Props = {
  disabled: boolean
  onLocationChange: (geolocation: { lat: number; lon: number }) => void
}

export default function PostGeolocationButton({ disabled, onLocationChange }: Props) {
  const t = useTranslations('Community.geolocation')

  function handleClick() {
    if (!navigator.geolocation) {
      toast.warning(t('unavailable'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onLocationChange({ lat: latitude, lon: longitude })
        toast.warning(t('unsupported'))
      },
      (error) => {
        console.warn(error)
        toast.warning(t('unavailable'))
      },
    )
  }

  return (
    <PostBaseButton disabled={disabled} onClick={handleClick}>
      <input className="hidden" disabled={disabled} />
      <MapPin className="size-5 shrink-0" />
    </PostBaseButton>
  )
}
