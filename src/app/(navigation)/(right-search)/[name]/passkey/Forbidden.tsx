import IconShield from '@/components/icons/IconShield'

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-8 h-24 w-24 rounded-3xl bg-gradient-to-br from-brand-end/20 to-brand-end/5 flex items-center justify-center">
        <IconShield className="h-12 w-12 text-brand-end" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3">패스키 관리 권한이 없어요</h2>
      <p className="text-base text-zinc-400 max-w-sm mb-8">다른 사용자의 패스키는 볼 수 없어요</p>
    </div>
  )
}
