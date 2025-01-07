/* eslint-disable @next/next/no-img-element */
'use client';

import { HASHA_CDN_DOMAIN } from '@/common/constant';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_ERROR_COUNT = 3;

type Props = {
  id: string;
};

export default function ImageViewer({ id }: Props) {
  const [index, setIndex] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [padLength, setPadLength] = useState(1);
  const errorCount = useRef(0);
  const router = useRouter();
  const [maxImageCount, setMaxImageCount] = useState(Infinity);

  function setPrevIndex() {
    setIndex((prev) => Math.max(1, prev - 1));
  }

  const setNextIndex = useCallback(() => {
    setIndex((prev) => Math.min(prev + 1, maxImageCount));
  }, [maxImageCount]);

  function handleError() {
    if (errorCount.current >= MAX_ERROR_COUNT) return;

    setPadLength((prev) => prev + 1);
    errorCount.current++;
  }

  useEffect(() => {
    function handleKeyDown({ code }: KeyboardEvent) {
      if (code === 'ArrowLeft') {
        setPrevIndex();
      } else if (code === 'ArrowRight') {
        setNextIndex();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, setNextIndex]);

  return (
    <ul className="relative">
      <img
        alt="manga-image"
        className="h-1 w-1 absolute -top-1 -left-1"
        fetchPriority="high"
        height={1536}
        referrerPolicy="no-referrer"
        src={`${HASHA_CDN_DOMAIN}/${id}/${'1'.padStart(padLength, '0')}.webp`}
        width={1536}
        onLoad={() => setIsSuccess(true)}
        onError={handleError}
      />
      {isSuccess &&
        [-2, -1, 0, 1, 2].map(
          (offset) =>
            index + offset > 0 &&
            index + offset <= maxImageCount && (
              <li key={offset}>
                <img
                  alt={`manga-image-${index + offset}`}
                  aria-hidden={offset !== 0}
                  className="h-svh object-contain aria-hidden:h-1 aria-hidden:w-1 aria-hidden:absolute aria-hidden:-top-1 aria-hidden:-left-1"
                  fetchPriority="high"
                  height={1536}
                  referrerPolicy="no-referrer"
                  src={`${HASHA_CDN_DOMAIN}/${id}/${String(
                    index + offset,
                  ).padStart(padLength, '0')}.webp`}
                  width={1536}
                  onError={() => setMaxImageCount(index + offset - 1)}
                />
              </li>
            ),
        )}
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
