import { getImageSrc } from '@/constants/url'
import { type Manga } from '@/types/manga'
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual'
import { useRef } from 'react'

type Props = {
  manga: Manga
  isDoublePage: boolean
  onImageClick: () => void
}

export default function ScrollViewer({ manga, isDoublePage, onImageClick }: Props) {
  const { images, cdn, id } = manga

  const parentRef = useRef<HTMLDivElement>(null)
  const rowCount = isDoublePage ? Math.ceil(images.length / 2) : images.length

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // 각 row의 높이를 추정 (필요에 따라 조절)
    overscan: 5,
  })

  const renderRow = ({ index, start, size }: VirtualItem) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: size,
      transform: `translateY(${start}px)`,
    }
    if (isDoublePage) {
      const firstIndex = index * 2
      const secondIndex = firstIndex + 1
      return (
        <li key={index} onClick={onImageClick} ref={rowVirtualizer.measureElement} style={style}>
          <div className="flex justify-center gap-1">
            <img
              alt={`manga-image-${firstIndex + 1}`}
              loading="lazy"
              src={getImageSrc({ cdn, id, name: images[firstIndex].name })}
            />
            {images[secondIndex] && (
              <img
                alt={`manga-image-${secondIndex + 1}`}
                loading="lazy"
                src={getImageSrc({ cdn, id, name: images[secondIndex].name })}
              />
            )}
          </div>
        </li>
      )
    } else {
      return (
        <li key={index} onClick={onImageClick} ref={rowVirtualizer.measureElement} style={style}>
          <img
            alt={`manga-image-${index + 1}`}
            loading="lazy"
            src={getImageSrc({ cdn, id, name: images[index].name })}
          />
        </li>
      )
    }
  }

  return (
    <div className="overflow-y-auto h-screen relative" ref={parentRef}>
      <ul style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => renderRow(virtualRow))}
      </ul>
    </div>
  )
}
