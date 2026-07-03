import StudioEarnings from '../../../_components/StudioEarnings'

export default async function StudioEarningsPage({ params }: PageProps<'/[locale]/sobok/studio/[handle]/earnings'>) {
  const { handle } = await params
  return <StudioEarnings handle={handle} />
}
