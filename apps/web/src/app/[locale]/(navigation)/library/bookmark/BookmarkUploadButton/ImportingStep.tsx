import { Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Props = {
  isVisible: boolean
}

export function ImportingStep({ isVisible }: Props) {
  const t = useTranslations('Library.bookmark')

  return (
    <div
      aria-hidden={!isVisible}
      className="absolute inset-0 transition aria-hidden:opacity-0 aria-hidden:pointer-events-none flex items-center justify-center"
    >
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-zinc-800/40 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-blue-500 rounded-full animate-spin" />
          <Upload className="absolute inset-0 m-auto size-10 text-blue-400" />
        </div>
        <p className="text-foreground font-semibold text-lg mb-2">{t('uploadProgressTitle')}</p>
        <p className="text-sm text-zinc-500">{t('uploadProgressDescription')}</p>
      </div>
    </div>
  )
}
