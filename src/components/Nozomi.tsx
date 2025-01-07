'use client';

import fetchNozomi from '@/service/fetchNozomi';
import { useEffect } from 'react';

export function Nozomi() {
  useEffect(() => {
    fetchNozomi({ startByte: '0', endByte: '99' }).then((data) => {
      if (data) {
        console.log(data);
      }
    });
  }, []);

  return (
    <div>
      <h1>Nozomi</h1>
    </div>
  );
}
