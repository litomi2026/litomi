import IconSpinner from '@/components/icons/IconSpinner'

export default function Loading() {
  return (
    <div className="p-4 flex-1 flex justify-center items-center">
      <h1 className="sr-only">북마크</h1>
      <IconSpinner className="size-6" />
    </div>
  )
}
