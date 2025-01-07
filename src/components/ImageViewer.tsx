/* eslint-disable @next/next/no-img-element */
'use client';

import useImageNavigation from '@/hook/useImageNavigation';
import useImagePadLength from '@/hook/useImagePadLength';
import useServiceWorker from '@/hook/useServiceWorker';
import { useState } from 'react';

type Props = {
  id: string;
};

export default function ImageViewer({ id }: Props) {
  const [maxImageCount, setMaxImageCount] = useState(Infinity);
  const imageNavigation = useImageNavigation({ maxImageCount });
  const { index, setPrevIndex, setNextIndex } = imageNavigation;
  const isSWRegistered = useServiceWorker('/sw.js');
  const imagePadLength = useImagePadLength({ id, enabled: isSWRegistered });
  const { isSuccess, padLength } = imagePadLength;

  return (
    <ul className="relative">
      {isSuccess &&
        [-2, -1, 0, 1, 2].map((offset) => {
          const imageId = index + offset;
          if (imageId < 1 || imageId > maxImageCount) return;

          return (
            <li key={offset}>
              <img
                alt={`manga-image-${index + offset}`}
                aria-hidden={offset !== 0}
                className="h-svh object-contain aria-hidden:h-1 aria-hidden:w-1 aria-hidden:absolute aria-hidden:-top-1 aria-hidden:-left-1"
                fetchPriority="high"
                referrerPolicy="no-referrer"
                src={`/$/${id}/${String(index + offset).padStart(
                  padLength,
                  '0',
                )}`}
                onError={() => setMaxImageCount(index + offset - 1)}
              />
            </li>
          );
        })}
      <div
        className="absolute left-0 top-0 h-full w-1/3 cursor-pointer focus:outline-none"
        onClick={() => setPrevIndex()}
      />{' '}
      <div
        className="absolute right-0 top-0 h-full w-1/3 cursor-pointer focus:outline-none"
        onClick={() => setNextIndex()}
      />
    </ul>
  );
}
