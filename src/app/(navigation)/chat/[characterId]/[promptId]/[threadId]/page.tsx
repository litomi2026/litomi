import { ChatGate } from './ChatGate'
import ChatThread from './ChatThread'

export default async function Page({ params }: PageProps<'/chat/[characterId]/[promptId]/[threadId]'>) {
  const { characterId, promptId, threadId } = await params

  return (
    <ChatGate>
      <ChatThread characterId={characterId} promptId={promptId} threadId={threadId} />
    </ChatGate>
  )
}
