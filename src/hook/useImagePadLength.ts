import { useEffect, useRef, useState } from 'react';

const MAX_ERROR_COUNT = 3;

type Params = {
  id: string;
  enabled?: boolean;
};

export default function useImagePadLength({ id, enabled }: Params) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [padLength, setPadLength] = useState(1);
  const errorCount = useRef(0);

  function handleError() {
    if (errorCount.current >= MAX_ERROR_COUNT) return;
    setPadLength((prev) => prev + 1);
    errorCount.current++;
  }

  useEffect(() => {
    if (!enabled) return;

    (async () => {
      try {
        const res = await fetch(`/$/${id}/${'1'.padStart(padLength, '0')}`);
        if (res.ok) {
          setIsSuccess(true);
          return;
        } else {
          handleError();
        }
      } catch {
        handleError();
      }
    })();
  }, [enabled, id, padLength]);

  return { isSuccess, padLength };
}
