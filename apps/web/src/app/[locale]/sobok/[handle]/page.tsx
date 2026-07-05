import { notFound } from 'next/navigation'

import ChatRoom from '../_components/ChatRoom'

export default async function RoomPage({ params }: PageProps<'/[locale]/sobok/[handle]'>) {
  const { handle: segment } = await params
  const decoded = decodeURIComponent(segment)

  if (!decoded.startsWith('@')) {
    notFound()
  }

  return <ChatRoom handle={decoded.slice(1)} />
}
