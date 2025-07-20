import type { LayoutProps } from '@/types/nextjs'

export default async function Layout({ children }: LayoutProps) {
  return (
    <main className="flex flex-col gap-2 p-2 h-full">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">콘텐츠 필터링 설정</h1>
        <p className="text-zinc-400">
          특정 태그, 작가, 캐릭터 등을 설정하여 원하지 않는 콘텐츠를 블러 처리하거나 숨길 수 있습니다.
        </p>
      </div>
      {children}
    </main>
  )
}
