export const POST_DETAIL_CURRENT_ANCHOR_ID = 'post-detail'

export function getPostDetailHref(postId: number) {
  return `/post/${postId}#${POST_DETAIL_CURRENT_ANCHOR_ID}`
}
