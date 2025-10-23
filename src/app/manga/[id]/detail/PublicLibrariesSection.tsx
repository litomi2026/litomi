'use client'

import { Library } from 'lucide-react'
import Link from 'next/link'

import { intToHexColor } from '@/utils/color'

type LibraryData = {
  id: number
  name: string
  description: string | null
  color: number | null
  icon: string | null
  itemCount: number
}

type Props = {
  libraries: LibraryData[]
}

export default function PublicLibrariesSection({ libraries }: Props) {
  return (
    <div className="border-b-2 p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Library className="size-4" />이 작품이 포함된 공개 서재
      </h3>
      <ul className="flex gap-2 overflow-x-auto scrollbar-hidden snap-x snap-mandatory">
        {libraries.map((library) => (
          <li className="flex-shrink-0 w-48 snap-start" key={library.id}>
            <Link
              className="flex flex-col gap-1 h-full p-3 bg-zinc-900 rounded-lg transition border-2 border-transparent hover:border-zinc-600"
              href={`/library/${library.id}`}
            >
              <div className="flex items-center gap-2">
                {library.icon && (
                  <div
                    className="size-6 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: intToHexColor(library.color) || '#3f3f46' }}
                  >
                    <span className="text-sm">{library.icon}</span>
                  </div>
                )}
                <h4 className="text-sm font-medium text-zinc-200 line-clamp-1 break-all">{library.name}</h4>
                <p className="text-xs text-zinc-500 flex-shrink-0">{library.itemCount}개</p>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-1 break-all">{library.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
