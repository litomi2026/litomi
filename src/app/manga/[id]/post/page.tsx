import type { PageProps } from '@/types/nextjs'

export const dynamic = 'error'

type Params = {
  id: string
}

export default async function Page({ params }: PageProps<Params>) {
  const { id } = await params

  return (
    <div className="p-4">
      <pre className="overflow-x-scroll">{JSON.stringify({ id }, null, 2)}</pre>
    </div>
  )
}
