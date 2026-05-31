import type { ReactNode } from 'react'

import { twMerge } from 'tailwind-merge'

import { Link } from '@/i18n/navigation'

import { getStatusActionClassName, type StatusActionVariant } from './styles'

export type StatusStateIntent = 'auth' | 'blocked' | 'default' | 'setup' | 'verify'

const STATUS_INTENT_TEXT_CLASS_NAME = {
  auth: {
    title: 'text-foreground',
    description: 'text-zinc-300',
    icon: 'border-brand/30 bg-brand/10 text-brand',
  },
  blocked: {
    title: 'text-red-50',
    description: 'text-zinc-400',
    icon: 'border-red-900/50 bg-red-900/15 text-red-400',
  },
  default: {
    title: 'text-foreground',
    description: 'text-zinc-400',
    icon: 'border-zinc-800 bg-zinc-950/75 text-zinc-400',
  },
  setup: {
    title: 'text-foreground',
    description: 'text-zinc-300',
    icon: 'border-brand/30 bg-brand/10 text-brand',
  },
  verify: {
    title: 'text-amber-50',
    description: 'text-zinc-300',
    icon: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
} satisfies Record<StatusStateIntent, { description: string; title: string; icon: string }>

type StatusActionLinkProps = {
  children: ReactNode
  className?: string
  href: string
  icon?: ReactNode
  prefetch?: boolean
  variant?: StatusActionVariant
}

type StatusStateProps = {
  children?: ReactNode
  className?: string
  description: ReactNode
  icon: ReactNode
  intent?: StatusStateIntent
  title: string
}

export function StatusActionLink({
  children,
  className,
  href,
  icon,
  prefetch = false,
  variant = 'primary',
}: StatusActionLinkProps) {
  return (
    <Link className={getStatusActionClassName(variant, className)} href={href} prefetch={prefetch}>
      {icon}
      {children}
    </Link>
  )
}

export default function StatusState({
  children,
  className,
  description,
  icon,
  intent = 'default',
  title,
}: StatusStateProps) {
  const textClassName = STATUS_INTENT_TEXT_CLASS_NAME[intent]

  return (
    <section className={twMerge('flex min-h-88 flex-1 items-center justify-center px-4 py-14 text-center', className)}>
      <div className="w-full max-w-xl">
        <div className="relative mx-auto mb-7 flex justify-center">
          <div
            aria-hidden
            className={twMerge(
              'grid size-16 place-items-center rounded-2xl border shadow-[0_18px_42px_rgba(0,0,0,0.22)] [&>svg]:size-8 [&>svg]:shrink-0',
              textClassName.icon,
            )}
          >
            {icon}
          </div>
        </div>
        <h2
          className={twMerge(
            'text-balance text-xl font-bold leading-8 tracking-normal sm:text-2xl',
            textClassName.title,
          )}
        >
          {title}
        </h2>
        <p
          className={twMerge(
            'mx-auto mt-3 max-w-md whitespace-pre-line text-pretty text-sm leading-6 sm:text-base',
            textClassName.description,
          )}
        >
          {description}
        </p>
        {children && <div className="mt-8 flex flex-col items-center gap-3">{children}</div>}
      </div>
    </section>
  )
}
