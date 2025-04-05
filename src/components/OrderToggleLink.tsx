import { OrderParam } from '@/utils/param'
import Link from 'next/link'

type OrderToggleProps = {
  currentOrder: string
  hrefPrefix?: string
  hrefSuffix?: string
  disabled?: boolean
}

export default function OrderToggleLink({
  disabled,
  currentOrder,
  hrefPrefix = '',
  hrefSuffix = '',
}: OrderToggleProps) {
  const selectedOrderIndex = currentOrder === OrderParam.DESC ? 0 : 1

  return (
    <div
      className="relative grid grid-cols-2 bg-zinc-900 border-2 p-1 rounded-xl text-zinc-400
        [&_a]:relative [&_a]:rounded [&_a]:flex [&_a]:items-center [&_a]:px-3 [&_a]:py-1 [&_a]:aria-current:font-bold [&_a]:aria-current:text-background [&_a]:aria-current:pointer-events-none
        [&_a]:aria-disabled:pointer-events-none [&_a]:aria-disabled:text-zinc-500"
    >
      <Link
        aria-current={currentOrder === OrderParam.DESC}
        aria-disabled={disabled}
        className="aria-disabled:[&>div]:bg-none aria-disabled:[&>div]:before:border-zinc-700"
        href={`${hrefPrefix}desc${hrefSuffix}`}
      >
        <div
          aria-hidden={!currentOrder}
          className="absolute inset-0 bg-zinc-700 bg-brand-gradient rounded-lg pointer-events-none transition aria-hidden:opacity-0
            before:absolute before:inset-0 before:rounded-lg before:border-2 before:border-white/40"
          style={{ transform: `translateX(${100 * selectedOrderIndex}%)` }}
        />
        <span className="relative">내림차순</span>
      </Link>
      <Link aria-current={currentOrder === 'asc'} aria-disabled={disabled} href={`${hrefPrefix}asc${hrefSuffix}`}>
        오름차순
      </Link>
    </div>
  )
}
