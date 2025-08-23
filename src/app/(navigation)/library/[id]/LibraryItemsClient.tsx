type LibraryItem = {
  libraryId: number
  mangaId: number
  createdAt: Date
}

type Props = {
  library: {
    id: number
    name: string
  }
  initialItems?: LibraryItem[]
  isOwner: boolean
}

export default function LibraryItemsClient({ library, initialItems, isOwner }: Readonly<Props>) {
  return <div>LibraryItemsClient</div>
}
