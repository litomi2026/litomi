import { handleRouteError } from '@/crawler/proxy-utils'

export const runtime = 'edge'
const maxAge = 43200 // 12 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    const response = await fetch(`https://komi.la/api/galleries/${id}`)
    const data = await response.json()

    return Response.json(data, {
      // headers: {
      //   'Cache-Control': createCacheControl({
      //     public: true,
      //     maxAge,
      //     sMaxAge: maxAge,
      //     staleWhileRevalidate: maxAge,
      //   }),
      // },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
