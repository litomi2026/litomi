/* eslint-disable @next/next/no-img-element */
'use client';

import useImageNavigation from '@/hook/useImageNavigation';
import useServiceWorker from '@/hook/useServiceWorker';
import { type Manga } from '@/types/manga';

type Props = {
  manga: Manga;
};

export default function ImageViewer({ manga }: Props) {
  const { id, images } = manga;
  const maxImageIndex = images.length - 1;
  const { currentIndex, setPrevIndex, setNextIndex } = useImageNavigation({
    maxImageIndex,
  });
  const isSWRegistered = useServiceWorker('/sw.js');

  return (
    <ul className="relative">
      {isSWRegistered &&
        [-2, -1, 0, 1, 2].map((offset) => {
          const imageIndex = currentIndex + offset;
          if (imageIndex < 0 || imageIndex > maxImageIndex) return;

          return (
            <li key={offset}>
              <img
                alt={`manga-image-${currentIndex + offset}`}
                aria-hidden={offset !== 0}
                className="h-svh mx-auto object-contain aria-hidden:h-1 aria-hidden:w-1 aria-hidden:absolute aria-hidden:-top-1 aria-hidden:-left-1"
                fetchPriority="high"
                referrerPolicy="no-referrer"
                src={`/$/${id}/${images[imageIndex].name}`}
              />
            </li>
          );
        })}
      <div
        className="absolute left-0 top-0 h-full w-1/3 cursor-pointer focus:outline-none"
        onClick={() => setPrevIndex()}
      />
      <div
        className="absolute right-0 top-0 h-full w-1/3 cursor-pointer focus:outline-none"
        onClick={() => setNextIndex()}
      />
    </ul>
  );
}
