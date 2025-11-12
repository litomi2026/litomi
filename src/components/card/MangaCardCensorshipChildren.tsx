import childrenDay from './children-day.json'

const CHILDREN_DAY = childrenDay as Record<string, Record<string, string | undefined>>

type Props = {
  locale: string | undefined
}

export default function MangaCardCensorshipChildren({ locale = '' }: Props) {
  return (
    <div className="absolute inset-0 animate-fade-in-fast flex items-center justify-center text-center p-4 bg-background/90">
      <div className="flex flex-col gap-2 max-w-xs">
        <div className="text-lg font-bold text-foreground">
          {CHILDREN_DAY.children_day_title[locale] ?? CHILDREN_DAY.children_day_title.ko}
        </div>
        <div className="text-sm text-zinc-400">
          {CHILDREN_DAY.children_day_description[locale] ?? CHILDREN_DAY.children_day_description.ko}
        </div>
      </div>
    </div>
  )
}
