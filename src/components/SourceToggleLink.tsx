import Link from 'next/link'

type OrderToggleProps = {
  currentSource: 'ha' | 'hi'
}

export default function SourceToggleLink({ currentSource }: OrderToggleProps) {
  const selectedOrderIndex = currentSource === 'ha' ? 0 : 1

  return (
    <div
      className="relative grid grid-cols-2 bg-zinc-900 border-2 border-zinc-800 p-1 rounded-xl text-zinc-400 text-sm md:text-base
        [&_a]:relative [&_a]:rounded [&_a]:px-3 [&_a]:py-1 [&_a]:aria-current:font-bold [&_a]:aria-current:text-foreground [&_a]:aria-current:pointer-events-none"
    >
      <Link aria-current={currentSource === 'ha'} href="ha">
        <div
          className="absolute inset-0 bg-zinc-800 rounded-lg border-2 border-zinc-700 pointer-events-none"
          style={{ transform: `translateX(${100 * selectedOrderIndex}%)` }}
        />
        <span className="relative">ha</span>
      </Link>
      <Link aria-current={currentSource === 'hi'} href="hi">
        hi
      </Link>
    </div>
  )
}
