import PromptList from './PromptList'

export default async function Page({ params }: PageProps<'/chat/[characterId]'>) {
  const { characterId } = await params
  return <PromptList characterId={characterId} />
}
