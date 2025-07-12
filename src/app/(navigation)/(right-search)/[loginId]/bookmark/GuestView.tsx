import MangaCard from '@/components/card/MangaCard'
import { harpiMangas } from '@/database/harpi'
import { SourceParam } from '@/utils/param'

export function GuestView() {
  return (
    <>
      <h2 className="text-center font-bold text-xl text-yellow-300 py-4">예시 화면이에요. 로그인 후 이용해주세요 🔖</h2>
      <ul className="grid gap-2 md:grid-cols-2">
        {/* <MangaCard manga={harpiMangas[Object.keys(harpiMangas)[0]]} source={SourceParam.HARPI} /> */}
      </ul>
    </>
  )
}
