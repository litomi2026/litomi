import type {
  DELETEV1PostIdLikeResponse,
  DELETEV1PostIdResponse,
  POSTV1PostBody,
  POSTV1PostResponse,
  PUTV1PostIdLikeResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export type SetPostLikeResponse = DELETEV1PostIdLikeResponse | PUTV1PostIdLikeResponse

export async function createPost(body: POSTV1PostBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/post`

  const { data } = await fetchWithErrorHandling<POSTV1PostResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deletePost(postId: number) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/post/${postId}`

  const { data } = await fetchWithErrorHandling<DELETEV1PostIdResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function toggleLikingPost(postId: number, liked: boolean) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/post/${postId}/like`

  const { data } = await fetchWithErrorHandling<SetPostLikeResponse>(url, {
    method: liked ? 'PUT' : 'DELETE',
    credentials: 'include',
  })

  return data
}
