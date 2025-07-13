import IconMapPin from '@/components/icons/IconMapPin'

import PostBaseButton from './PostBaseButton'

type Props = {
  disabled: boolean
  onLocationChange: (geolocation: { lat: number; lon: number }) => void
}

export default function PostGeolocationButton({ disabled, onLocationChange }: Readonly<Props>) {
  return (
    <PostBaseButton
      disabled={disabled}
      onClick={() => {
        if (!navigator.geolocation) {
          console.log('Geolocation is not supported by this browser.')
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            onLocationChange({ lat: latitude, lon: longitude })
          },
          (error) => {
            console.error('Error getting location:', error)
          },
        )
      }}
    >
      <input className="hidden" disabled={disabled} />
      <IconMapPin className="w-5" />
    </PostBaseButton>
  )
}
