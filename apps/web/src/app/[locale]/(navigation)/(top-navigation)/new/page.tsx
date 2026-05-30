import { redirect } from 'next/navigation'

export const dynamic = 'force-static'

export default async function Page({ params }: PageProps<'/[locale]/new'>) {
  const { locale } = await params
  redirect(`/${locale}/new/1`)
}
