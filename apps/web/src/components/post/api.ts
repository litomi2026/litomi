import type {
  DELETEV1PostIdLikeResponse,
  DELETEV1PostIdResponse,
  POSTV1PostBody,
  POSTV1PostResponse,
  PUTV1PostIdLikeResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export type SetPostLikeResponse = DELETEV1PostIdLikeResponse | PUTV1PostIdLikeResponse

export async function createPost(body: POSTV1PostBody) {
  const url = new URL('/api/v1/post', NEXT_PUBLIC_API_ORIGIN)

  const { data } = await fetchAPIData<POSTV1PostResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deletePost(postId: number) {
  const url = new URL(`/api/v1/post/${postId}`, NEXT_PUBLIC_API_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1PostIdResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function toggleLikingPost(postId: number, liked: boolean) {
  const url = new URL(`/api/v1/post/${postId}/like`, NEXT_PUBLIC_API_ORIGIN)

  const { data } = await fetchAPIData<SetPostLikeResponse>(url, {
    method: liked ? 'PUT' : 'DELETE',
  })

  return data
}
