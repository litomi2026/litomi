import { BasePageProps } from '@/common/type';
import CoverImageViewer from '@/components/CoverImageViewer';
import Link from 'next/link';
import mangas from '@/database/manga.json';

const mangaIds = Object.keys(mangas) as (keyof typeof mangas)[];

const MANGA_PER_PAGE = 20;
const mangaByPage = Array.from({
  length: Math.ceil(mangaIds.length / MANGA_PER_PAGE),
}).map((_, i) => mangaIds.slice(i * MANGA_PER_PAGE, (i + 1) * MANGA_PER_PAGE));

export default async function Page(props: BasePageProps) {
  const params = await props.params;
  const page = params.page;

  return (
    <main className="p-2 max-w-screen-2xl mx-auto">
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
        {mangaByPage[+page].map((id) => (
          <li key={id}>
            <Link href={`/${page}/${id}`}>
              <CoverImageViewer src={`/$/${id}/${mangas[id].images[0].name}`} />
            </Link>
          </li>
        ))}
      </ul>
      <nav className="flex justify-center overflow-x-auto">
        <ol className="flex min-w-0 font-bold py-4 text-2xl [&_a]:p-4">
          <li>
            <Link href="/1">1</Link>
          </li>
          <li>
            <Link href="/2">2</Link>
          </li>
          <li>
            <Link href="/3">3</Link>
          </li>
          <li>
            <Link href="/4">4</Link>
          </li>
          <li>
            <Link href="/5">5</Link>
          </li>
          <li>
            <Link href="/6">6</Link>
          </li>
          <li>
            <Link href="/7">7</Link>
          </li>
          <li>
            <Link href="/8">8</Link>
          </li>
          <li>
            <Link href="/9">9</Link>
          </li>
          <li>
            <Link href="/10">10</Link>
          </li>
        </ol>
      </nav>

      <footer className="text-center">
        <p>© 2025 ~</p>
      </footer>
    </main>
  );
}
