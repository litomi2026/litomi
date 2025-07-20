import IconSpinner from '@/components/icons/IconSpinner'

export default function Loading() {
  return (
    <div className="flex justify-center items-center p-8">
      <IconSpinner className="w-6 animate-spin" />
    </div>
  )
}
