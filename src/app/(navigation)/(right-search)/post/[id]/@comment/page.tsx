import type { PageProps } from '@/types/nextjs'

export default async function Page({ params }: PageProps) {
  const { id } = await params

  return <div className="min-h-screen">{id}</div>
}
