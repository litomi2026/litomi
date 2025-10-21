export default async function Page({ params }: PageProps<'/post/[id]'>) {
  const { id } = await params

  return <div>comment</div>
}
