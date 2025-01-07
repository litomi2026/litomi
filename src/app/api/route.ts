import http2 from 'http2';
import { NextResponse } from 'next/server';

export async function GET() {
  const imageBuffer = await fetchImageUsingHttp2();

  return new NextResponse(Buffer.from(imageBuffer), {
    headers: {
      'Content-Type': 'image/webp',
    },
  });
}

async function fetchImageUsingHttp2() {
  const client = http2.connect('https://cdn-nl-01.hasha.in');

  return new Promise<Buffer<ArrayBuffer>>((resolve, reject) => {
    const req = client.request({
      ':method': 'GET',
      ':path': '/3185634/18.webp',
      'User-Agent': 'curl/8.4.0',
      Accept: '*/*',
    });

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
