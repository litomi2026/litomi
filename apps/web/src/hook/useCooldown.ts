import { useEffect, useState } from 'react'

export default function useCooldown(initialCooldown = 5000) {
  const [cooldown, setCooldown] = useState(initialCooldown)

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1000
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return cooldown
}
