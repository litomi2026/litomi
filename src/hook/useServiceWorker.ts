import { useState, useEffect } from 'react';

export default function useServiceWorker(path: string) {
  const [isSWRegistered, setIsSWRegistered] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(path)
        .then(() => setIsSWRegistered(true))
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, [path]);

  return isSWRegistered;
}
