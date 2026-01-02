import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="w-6 animate-spin" />
    </div>
  )
}
