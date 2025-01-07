import fetchNozomi from '@/service/fetchNozomi';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get('start') ?? '0';
  const end = searchParams.get('end') ?? '99';

  const a = await fetchNozomi({ startByte: start, endByte: end });

  return Response.json(a);
}
