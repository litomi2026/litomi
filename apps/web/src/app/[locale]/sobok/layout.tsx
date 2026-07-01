import ChatProvider from './_components/ChatProvider'
import ChatRealtime from './_components/ChatRealtime'

export default function SobokLayout({ children }: LayoutProps<'/[locale]'>) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-brand/10 via-background to-background -z-10" />
      <div className="w-full h-dvh bg-background sm:h-[min(100dvh-2rem,850px)] sm:max-w-lg sm:rounded-3xl sm:shadow-2xl sm:ring-1 sm:ring-foreground/10 relative overflow-hidden flex flex-col">
        <ChatProvider>
          <ChatRealtime />
          {children}
        </ChatProvider>
      </div>
    </div>
  )
}
