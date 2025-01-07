/* eslint-disable @next/next/no-img-element */
'use client';

import useImagePadLength from '@/hook/useImagePadLength';
import useServiceWorker from '@/hook/useServiceWorker';

type Props = {
  id: string;
};

export default function CoverImageViewer({ id }: Props) {
  const isSWRegistered = useServiceWorker('/sw.js');
  const imagePadLength = useImagePadLength({ id, enabled: isSWRegistered });
  const { isSuccess, padLength } = imagePadLength;
  const imageId = '1'.padStart(padLength, '0');
  const imageURL = isSuccess
    ? `/$/${id}/${imageId}`
    : 'https://via.placeholder.com/100';

  return (
    <img
      alt="manga-image"
      width={1536}
      height={1536}
      className="object-contain"
      referrerPolicy="no-referrer"
      src={imageURL}
    />
  );
}
