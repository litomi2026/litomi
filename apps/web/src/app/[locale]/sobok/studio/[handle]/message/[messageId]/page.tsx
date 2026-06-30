import { StudioReplyRoom } from '../../../../_components/StudioReplyRoom'

type Props = PageProps<'/[locale]/sobok/studio/[handle]/message/[messageId]'>

export default async function ReplyRoomPage({ params }: Props) {
  const { handle, messageId } = await params
  return <StudioReplyRoom messageId={messageId} handle={handle} />
}
