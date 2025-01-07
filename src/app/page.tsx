/* eslint-disable @next/next/no-img-element */
import { Nozomi } from '@/components/Nozomi';

import Link from 'next/link';

const a = [
  '3185634',
  '3185561',
  '3185537',
  '3185532',
  '3185501',
  '3185500',
  '3185435',
  '3185309',
  '3185271',
  '3185267',
  '3185111',
  '3185025',
  '3184796',
  '3184794',
  '3184766',
  '3184754',
  '3184522',
  '3184514',
  '3184498',
  '3184435',
  '3184346',
  '3184345',
  '3184285',
  '3184248',
  '3184171',
];

export default function Home() {
  return (
    <ul className="grid grid-cols-[] gap-4">
      {a.map((id) => (
        <li key={id}>
          <Link href={`/${id}`}>
            <img
              alt="manga-image"
              height={1536}
              referrerPolicy="no-referrer"
              src={`https://cdn-nl-01.hasha.in/${id}/01.webp`}
              width={1536}
            />
          </Link>
        </li>
      ))}
      <Nozomi />
    </ul>
  );
}
