import type { LayoutProps } from '@/types/nextjs'

export default function Layout({ children }: LayoutProps) {
  return <div className="flex-1 flex flex-col p-4 sm:p-6">{children}</div>
}
