import type {
  DELETEV1PostIdLikeResponse,
  DELETEV1PostIdResponse,
  POSTV1PostBody,
  POSTV1PostResponse,
  PUTV1PostIdLikeResponse,
} from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export type SetPostLikeResponse = DELETEV1PostIdLikeResponse | PUTV1PostIdLikeResponse

export async function createPost(body: POSTV1PostBody) {
  const url = '/api/v1/post'

  const { data } = await fetchAPIData<POSTV1PostResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function deletePost(postId: number) {
  const url = `/api/v1/post/${postId}`

  const { data } = await fetchAPIData<DELETEV1PostIdResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function toggleLikingPost(postId: number, liked: boolean) {
  const url = `/api/v1/post/${postId}/like`

  const { data } = await fetchAPIData<SetPostLikeResponse>(url, {
    method: liked ? 'PUT' : 'DELETE',
  })

  return data
}
