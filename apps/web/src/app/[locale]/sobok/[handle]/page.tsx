import { ChatRoom } from '../_components/ChatRoom'

export default async function RoomPage({ params }: PageProps<'/[locale]/sobok/[handle]'>) {
  const { handle } = await params
  return <ChatRoom handle={handle} />
}
