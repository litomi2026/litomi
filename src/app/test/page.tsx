import LanguageBadge from '@/components/card/LanguageBadge'

export default function TestPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <LanguageBadge language="korean" />
      <LanguageBadge language="japanese" />
      <LanguageBadge language="english" />
      <LanguageBadge language="chinese" />
      <LanguageBadge language="spanish" />
      <LanguageBadge language="hungarian" />
      <LanguageBadge language="french" />
      <LanguageBadge language="german" />
      <LanguageBadge language="dutch" />
      <LanguageBadge language="italian" />
      <LanguageBadge language="portuguese" />
      <LanguageBadge language="russian" />
      <LanguageBadge language="thai" />
      <LanguageBadge language="vietnamese" />
      <LanguageBadge language="global" />
      <LanguageBadge language="speechless" />
      <LanguageBadge language="rewrite" />
    </div>
  )
}
