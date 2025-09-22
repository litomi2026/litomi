import { redirect } from 'next/navigation'

export const dynamic = 'force-static'

// NOTE: 하위 호환
export default async function Page({ params }: PageProps<'/manga/[id]'>) {
  const { id } = await params
  redirect(`/manga/${id}`)
}
