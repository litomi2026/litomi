import { createCacheControl } from '@/utils/cache-control'

export const privateCacheControl = createCacheControl({
  private: true,
  maxAge: 3,
})
