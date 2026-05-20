import MangaMetadataLink from './MangaMetadataLink'

type Props = {
  filterType: string
  labeledValues: { value: string; label: string }[]
  searchParams?: string
}

export default function MangaMetadataList({ filterType, labeledValues, searchParams }: Props) {
  return (
    <ul className="break-all">
      {labeledValues.map(({ value, label }, i) => (
        <MangaMetadataLink
          filterType={filterType}
          i={i}
          key={value}
          label={label}
          searchParams={searchParams}
          value={value}
        />
      ))}
    </ul>
  )
}
