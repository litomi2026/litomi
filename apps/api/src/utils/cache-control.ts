import { createCacheControl } from '@litomi/http/cache-control'

export const privateCacheControl = createCacheControl({
  private: true,
  maxAge: 3,
})
