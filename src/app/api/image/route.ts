import { NextResponse } from 'next/server';

export async function GET() {
  const imageUrl = 'https://cdn-nl-01.hasha.in/3185634/18.webp';

  try {
    const response = await fetch(imageUrl, {
      headers: {
        Referer: '', // no-referrer 동작
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch the image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();

    // NextResponse를 사용하여 이미지 반환
    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        'Content-Type': 'image/webp',
      },
    });
  } catch (error) {
    console.error('Error fetching the image:', error);
    return NextResponse.json(
      { message: 'Failed to fetch the image' },
      { status: 500 },
    );
  }
}
