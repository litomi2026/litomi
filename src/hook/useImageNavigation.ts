import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

type Params = {
  maxImageIndex: number;
};

export default function useImageNavigation({ maxImageIndex }: Params) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  function setPrevIndex() {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  const setNextIndex = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxImageIndex));
  }, [maxImageIndex]);

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

  return { currentIndex, setPrevIndex, setNextIndex };
}
