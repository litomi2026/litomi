import StudioSettings from '../../../_components/StudioSettings'

export default async function StudioSettingsPage({ params }: PageProps<'/[locale]/sobok/studio/[handle]/settings'>) {
  const { handle } = await params
  return <StudioSettings handle={handle} />
}
