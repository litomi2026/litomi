import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://cdn-nl-01.hasha.in/3185634/18.webp', {
      headers: {
        Referer: '', // no-referrer 동작
      },
    });
    console.log('👀 - response:', response);

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
