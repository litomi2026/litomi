import childrenDayJSON from './children-day.json'

export type ChildrenDayLocale = 'en' | 'ja' | 'ko' | 'zh-CN' | 'zh-TW'

type ChildrenDayMessages = {
  children_day_description: Record<ChildrenDayLocale, string>
  children_day_title: Record<ChildrenDayLocale, string>
}

const childrenDay = childrenDayJSON as ChildrenDayMessages

type Props = {
  locale: ChildrenDayLocale
}

export default function MangaCardCensorshipChildren({ locale }: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-center p-4 bg-background/90">
      <div className="flex flex-col gap-2 max-w-xs">
        <div className="text-lg font-bold text-foreground">{childrenDay.children_day_title[locale]}</div>
        <div className="text-sm text-zinc-400">{childrenDay.children_day_description[locale]}</div>
      </div>
    </div>
  )
}
