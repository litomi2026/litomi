/** @deprecated */
export async function fetchMangaImagesFromKHentai({ id }: { id: number }) {
  const res = await fetch(`https://k-hentai.org/hiyobi/list?id=${id}`, {
    referrerPolicy: 'no-referrer',
    // next: { revalidate: 86400 }, // 1 day
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    // captureException('k-hentai.org 서버 오류', { extra: { res, body } })
    throw new Error('k 서버에서 만화 이미지를 불러오는데 실패했어요.')
  }

  // const hiyobiImages = (await res.json()) as HiyobiImage[]
  // return hiyobiImages.map((image) => image.url)
}
