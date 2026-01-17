import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

type Props = {
  username?: string
  title?: string
  description?: string
}

export default function AdultVerificationGate({
  username,
  title = '성인인증이 필요해요',
  description = '성인 인증을 완료하면 이 기능을 사용할 수 있어요',
}: Readonly<Props>) {
  const settingsHref = username ? `/@${username}/settings#adult` : null

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <ShieldAlert className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-zinc-400 whitespace-pre-line">{description}</p>
          </div>
        </div>

        {settingsHref ? (
          <div className="mt-5 flex items-center gap-2">
            <Link
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
              href={settingsHref}
              prefetch={false}
            >
              익명으로 성인인증하기
            </Link>
          </div>
        ) : (
          <p className="mt-5 text-sm text-zinc-500">설정에서 익명 성인인증을 완료해 주세요</p>
        )}
      </div>
    </div>
  )
}
