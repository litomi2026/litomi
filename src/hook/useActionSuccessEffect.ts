import { useEffect } from 'react'

type Props<DataType> = {
  status?: number
  data?: DataType
  onSuccess?: (data?: DataType) => void
}

export default function useActionSuccessEffect<T>({ status, data, onSuccess }: Props<T>) {
  useEffect(() => {
    if (status && status >= 200 && status < 300) {
      onSuccess?.(data)
    }
  }, [status, data, onSuccess])

  return null
}
