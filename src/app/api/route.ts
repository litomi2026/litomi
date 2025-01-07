import http2 from 'http2';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const imageBuffer = await fetchImageUsingHttp2();
    console.log('👀 - imageBuffer:', imageBuffer);

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/webp',
      },
    });
  } catch (error) {
    console.error('Failed to fetch image via HTTP/2:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 },
    );
  }
}

async function fetchImageUsingHttp2() {
  const client = http2.connect('https://cdn-nl-01.hasha.in');

  return new Promise<Buffer<ArrayBuffer>>((resolve, reject) => {
    const req = client.request({
      ':method': 'GET',
      ':path': '/3185634/18.webp',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: '*/*',
    });

    console.log('👀 - req:', req);

    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const data = Buffer.concat(chunks);
      client.close();
      resolve(data);
    });

    req.on('error', (err) => {
      client.close();
      reject(err);
    });

    req.end();
  });
}
