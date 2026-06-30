import { ChatProvider } from './_components/ChatProvider'
import { SobokRealtime } from './_components/SobokRealtime'

export default function SobokLayout({ children }: LayoutProps<'/[locale]'>) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-100 via-gray-50 to-white dark:from-indigo-950/30 dark:via-gray-950 dark:to-black -z-10" />
      <div className="w-full max-w-md h-dvh bg-white dark:bg-[#0a0a0c] sm:h-[min(100dvh-2rem,850px)] sm:rounded-3xl sm:shadow-2xl sm:ring-1 sm:ring-gray-200 dark:sm:ring-white/10 relative overflow-hidden flex flex-col">
        <ChatProvider>
          <SobokRealtime />
          {children}
        </ChatProvider>
      </div>
    </div>
  )
}
