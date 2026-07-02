export interface DeletedReferredPost {
  isDeleted: true
}

export interface LiveReferredPost {
  isDeleted?: false
  id: number
  createdAt: Date
  updatedAt?: Date
  content?: string | null
  imageURLs?: string[] | null
  author?: {
    id: number
    nickname: string
    name: string
    imageURL?: string | null
  } | null
}

export type ReferredPost = DeletedReferredPost | LiveReferredPost
