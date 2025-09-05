export default async function Page({ params }: PageProps<'/post/[id]'>) {
  const { id } = await params

  return <div className="min-h-screen">{id}</div>
}
