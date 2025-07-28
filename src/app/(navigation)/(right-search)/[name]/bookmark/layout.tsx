import type { LayoutProps } from '@/types/nextjs'

export default async function Layout({ children }: LayoutProps) {
  return <main className="flex flex-col gap-2 p-2 h-full">{children}</main>
}
