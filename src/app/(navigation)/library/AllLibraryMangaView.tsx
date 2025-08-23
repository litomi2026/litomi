type Library = {
  id: number
  name: string
  color: string | null
  icon: string | null
}

type LibraryItem = {
  mangaId: number
  createdAt: number
  library: Library
}

type Props = {
  initialItems: LibraryItem[]
}

export default function AllLibraryMangaView({ initialItems }: Props) {
  return <div>AllLibraryMangaView</div>
}
