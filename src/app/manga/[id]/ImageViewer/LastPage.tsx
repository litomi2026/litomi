import LastPageActions from './LastPageActions'
import RatingInput from './RatingInput/RatingInput'

type Props = {
  manga: {
    id: number
    title: string
  }
}

export default function LastPage({ manga }: Props) {
  return (
    <div className="flex flex-col gap-4 p-4 py-16 min-w-3xs sm:min-w-xs">
      <RatingInput mangaId={manga.id} />
      <LastPageActions manga={manga} />
    </div>
  )
}
