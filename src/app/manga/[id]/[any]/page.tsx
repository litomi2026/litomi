import { redirect } from 'next/navigation'

// NOTE: 하위 호환
export default async function Page({ params }: PageProps<'/manga/[id]'>) {
  const { id } = await params
  redirect(`/manga/${id}`)
}
