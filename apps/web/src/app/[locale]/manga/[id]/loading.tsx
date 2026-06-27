import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <main className="flex justify-center items-center h-dvh p-4">
      <Loader2 aria-hidden="true" className="size-8 animate-spin" />
    </main>
  )
}
