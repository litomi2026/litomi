import StudioShell from '../../../_components/StudioShell'

export default async function StudioTabsLayout({ children, params }: LayoutProps<'/[locale]/sobok/studio/[handle]'>) {
  const { handle } = await params
  return <StudioShell handle={handle}>{children}</StudioShell>
}
