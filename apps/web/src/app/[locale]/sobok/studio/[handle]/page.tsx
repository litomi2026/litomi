import StudioBroadcastRoom from '../../_components/StudioBroadcastRoom'

export default async function BroadcastPage({ params }: PageProps<'/[locale]/sobok/studio/[handle]'>) {
  const { handle } = await params
  return <StudioBroadcastRoom handle={handle} />
}
