import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="size-6 shrink-0 animate-spin" />
    </div>
  )
}
