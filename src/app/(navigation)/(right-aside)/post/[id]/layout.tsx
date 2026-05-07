import BackButton from '@/components/BackButton'

export default function Layout({ post, comment }: LayoutProps<'/post/[id]'>) {
  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-2 pb-2 pt-[calc(0.5rem+var(--safe-area-top))] backdrop-blur whitespace-nowrap bg-background/70 border-background border-b sm:p-2">
        <div className="flex items-center gap-8">
          <BackButton
            className="hover:bg-zinc-500/50 focus-visible:outline-zinc-500 rounded-full p-2 transition"
            fallbackUrl="/posts/recommend"
          />
          <h2 className="text-xl font-bold">게시물</h2>
        </div>
        <button className="rounded-full border-2 border-zinc-600 px-4 py-1 text-sm font-bold mx-2">답글</button>
      </div>
      {post}
      {comment}
    </>
  )
}
