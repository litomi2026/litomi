import CoverImageViewer from '@/components/CoverImageViewer';
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
    <main className="p-2">
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
        {a.map((id) => (
          <li key={id}>
            <Link href={`/${id}`}>
              <CoverImageViewer id={id} />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
