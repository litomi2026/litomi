import { Nozomi } from '@/components/Nozomi';
import Image from 'next/image';
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
    <ul className="grid grid-cols-3 gap-4">
      {a.map((id) => (
        <li key={id}>
          <Link href={`/${id}`}>
            <Image
              alt="manga-image"
              height={1536}
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
