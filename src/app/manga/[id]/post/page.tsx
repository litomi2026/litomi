import type { BasePageProps } from '@/types/nextjs'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  return (
    <div className="p-4">
      <pre className="overflow-x-scroll">{JSON.stringify({ params }, null, 2)}</pre>
    </div>
  )
}
