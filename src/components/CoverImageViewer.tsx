/* eslint-disable @next/next/no-img-element */
'use client';

import useServiceWorker from '@/hook/useServiceWorker';

type Props = {
  src: string;
};

export default function CoverImageViewer({ src }: Props) {
  const isSWRegistered = useServiceWorker('/sw.js');

  return isSWRegistered ? (
    <img
      alt="manga-image"
      width={1536}
      height={1536}
      className="object-contain aspect-[3/4]"
      referrerPolicy="no-referrer"
      src={src}
    />
  ) : (
    <div className="bg-slate-500 aspect-[3/4] w-full" />
  );
}
