import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  title: string
  description: string
  icon: ReactNode
  benefits: {
    icon: ReactNode
    title: string
    description: string
  }[]
}

export default function Onboarding({ children, title, description, icon, benefits }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="size-24 mb-8 rounded-3xl bg-linear-to-br from-brand/20 to-brand/5 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-xl sm:text-2xl font-bold mb-3">{title}</h2>
      <p className="text-sm sm:text-base text-zinc-400 max-w-sm mb-8">{description}</p>
      <ul className="w-full max-w-md grid gap-3 mb-8">
        {benefits.map((benefit) => (
          <li className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-800/50" key={benefit.title}>
            <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
              {benefit.icon}
            </div>
            <div className="text-left">
              <p className="font-medium text-sm mb-0.5">{benefit.title}</p>
              <p className="text-xs text-zinc-500">{benefit.description}</p>
            </div>
          </li>
        ))}
      </ul>
      {children}
    </div>
  )
}
