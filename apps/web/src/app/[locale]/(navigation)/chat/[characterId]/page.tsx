import PromptList from './PromptList'

export default async function Page({ params }: PageProps<'/[locale]/chat/[characterId]'>) {
  const { characterId } = await params
  return <PromptList characterId={characterId} />
}
