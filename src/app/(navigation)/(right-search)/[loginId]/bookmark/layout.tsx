import type { BaseLayoutProps } from '@/types/nextjs'

export default async function Layout({ children }: BaseLayoutProps) {
  return <main className="flex flex-col gap-2 p-2 h-full">{children}</main>
}
