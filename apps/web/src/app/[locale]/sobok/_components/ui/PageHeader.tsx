import { ChevronLeft } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { Link } from '@/i18n/navigation'

interface HeaderBackLinkProps {
  href: ComponentProps<typeof Link>['href']
  className?: string
  label?: string
}

export function HeaderBackLink({ href, className, label }: HeaderBackLinkProps) {
  return (
    <Link
      aria-label={label}
      className={twMerge('p-2 text-zinc-400 transition-colors hover:text-foreground', className)}
      href={href}
    >
      <ChevronLeft className="h-6 w-6" />
    </Link>
  )
}

interface PageHeaderProps {
  back?: ReactNode
  title: ReactNode
  actions?: ReactNode
  className?: string
}

// The fixed h-14 chrome bar every sobok screen anchors to. Keeping it outside the data-loading
// content means it never disappears during fetches.
export default function PageHeader({ back, title, actions, className }: PageHeaderProps) {
  return (
    <header
      className={twMerge(
        'flex h-14 shrink-0 items-center gap-1 border-b border-foreground/10 bg-background/80 px-2',
        className,
      )}
    >
      {back}
      <div className="min-w-0 flex-1 pl-1">{title}</div>
      {actions}
    </header>
  )
}
