import { useCallback, useState } from 'react'

export function useImageStatus() {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)

  const handleSuccess = useCallback(() => setSuccess(true), [])
  const handleError = useCallback(() => setError(true), [])

  return {
    loaded: success || error,
    success,
    error,
    handleSuccess,
    handleError,
  }
}
