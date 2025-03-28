import IconBookmark from './icons/IconBookmark'
import SelectableLink from './SelectableLink'

export default function BookmarkLink() {
  return (
    <SelectableLink className="hidden sm:block" href={`/${1}/bookmark`} Icon={IconBookmark}>
      북마크
    </SelectableLink>
  )
}
