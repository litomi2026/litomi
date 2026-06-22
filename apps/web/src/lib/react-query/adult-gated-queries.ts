import type { QueryClient } from '@tanstack/react-query'

import { QueryKeys } from './query-keys'

// Cloudflare WAF(adult_gate_kr_deterrence, __Secure-adult-pass 쿠키 기반)로 게이트되어 게스트가 호출하면 403을 받는 쿼리
// 로그인/성인인증으로 adult-pass 쿠키가 바뀌어도 캐시된 403 응답은 다시 요청되지 않기에, 에러 상태를 reset해 다음 마운트에서 새로 요청하도록 한다.
const ADULT_GATED_QUERY_KEYS = [
  QueryKeys.proxyBase, // /api/proxy/*
  QueryKeys.postsBase, // /api/v1/post
  QueryKeys.infinitePublicLibraryMangasBase, // /api/v1/library/manga
]

export function resetAdultGatedQueries(queryClient: QueryClient) {
  for (const queryKey of ADULT_GATED_QUERY_KEYS) {
    queryClient.resetQueries({ queryKey })
  }
}
