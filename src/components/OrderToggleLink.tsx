import Link from 'next/link'

type OrderToggleProps = {
  currentOrder: 'asc' | 'desc'
  page: number
}

export default function OrderToggleLink({ currentOrder, page }: OrderToggleProps) {
  const selectedOrderIndex = currentOrder === 'desc' ? 0 : 1

  return (
    <div
      className="relative grid grid-cols-2 bg-zinc-900 border-2 border-zinc-800 p-1 rounded-xl text-zinc-500 
        [&_a]:relative [&_a]:rounded [&_a]:px-3 [&_a]:py-1 [&_a]:aria-selected:font-bold [&_a]:aria-selected:text-background"
    >
      <Link aria-selected={currentOrder === 'desc'} href={`../desc/${page}`}>
        <div
          className="absolute inset-0 bg-brand-gradient rounded-lg 
            before:absolute before:inset-0 before:rounded-lg before:border-2 before:border-white/40"
          style={{ transform: `translateX(${100 * selectedOrderIndex}%)` }}
        />
        <span className="relative">내림차순</span>
      </Link>
      <Link aria-selected={currentOrder === 'asc'} href={`../asc/${page}`}>
        오름차순
      </Link>
    </div>
  )
}
