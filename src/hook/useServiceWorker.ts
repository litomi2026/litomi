import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function useServiceWorker(path: string) {
  const [isSWRegistered, setIsSWRegistered] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(path)
        .then(() => setIsSWRegistered(true))
        .catch((error) => {
          toast.error('서비스 워커 등록에 실패했습니다.')
          console.error(error)
        })
    }
  }, [path])

  return isSWRegistered
}
