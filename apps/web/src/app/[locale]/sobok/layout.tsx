import ChatProvider from './_components/ChatProvider'
import ChatRealtime from './_components/ChatRealtime'
import SobokAuthGate from './_components/SobokAuthGate'

// The sobok zone owns the whole viewport (no site chrome). Zone-wide concerns live here:
// the coarse login gate, the shared WebSocket, and safe-area insets.
export default function SobokLayout({ children }: LayoutProps<'/[locale]'>) {
  return (
    <div className="flex h-dvh flex-col bg-background pl-[var(--safe-area-left)] pr-[var(--safe-area-right)] pt-[var(--safe-area-top)]">
      <SobokAuthGate>
        <ChatProvider>
          <ChatRealtime />
          {children}
        </ChatProvider>
      </SobokAuthGate>
    </div>
  )
}
