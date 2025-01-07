import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

type Params = {
  maxImageCount: number;
};

export default function useImageNavigation({ maxImageCount }: Params) {
  const router = useRouter();
  const [index, setIndex] = useState(1);

  function setPrevIndex() {
    setIndex((prev) => Math.max(1, prev - 1));
  }

  const setNextIndex = useCallback(() => {
    setIndex((prev) => Math.min(prev + 1, maxImageCount));
  }, [maxImageCount]);

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

  return { index, setPrevIndex, setNextIndex };
}
