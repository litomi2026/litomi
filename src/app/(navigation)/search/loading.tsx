import IconSpinner from '@/components/icons/IconSpinner'

export default async function Loading() {
  return (
    <div className="flex justify-center items-center flex-1 animate-fade-in [animation-delay:0.5s] [animation-fill-mode:both]">
      <IconSpinner className="size-8" />
    </div>
  )
}
