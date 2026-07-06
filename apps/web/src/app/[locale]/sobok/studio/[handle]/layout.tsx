import StudioOwnerGuard from '../../_components/StudioOwnerGuard'

export default async function StudioHandleLayout({ children, params }: LayoutProps<'/[locale]/sobok/studio/[handle]'>) {
  const { handle } = await params
  return <StudioOwnerGuard handle={handle}>{children}</StudioOwnerGuard>
}
