import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'

export default function NotFound() {
  return (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <div className="flex flex-1 justify-center items-center">
        <p className="text-zinc-500">서재를 찾을 수 없어요</p>
      </div>
    </>
  )
}
