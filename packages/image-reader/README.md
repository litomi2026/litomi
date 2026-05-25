# @litomi/image-reader

A client-side React image reader for comics, manga, galleries, and other ordered image experiences.

It provides paged and vertical or horizontal scroll reading modes, single-page and double-page spreads, touch and wheel navigation, zoom, thumbnails, slideshow controls, low-data rendering hints, reading-progress callbacks, and localized reader controls.

## Requirements

- React `>=19`
- React DOM `>=19`
- Tailwind CSS `>=4`
- A browser runtime. The reader uses `window`, `document`, `localStorage`, `sessionStorage`, pointer events, and the History API.
- An ESM-compatible bundler that can import package CSS.

This package is designed for client components. In frameworks with server components, such as Next.js App Router, render it from a file marked with `'use client'`.

## Installation

```bash
npm install @litomi/image-reader
```

Make sure the peer dependencies are installed in your application:

```bash
npm install react react-dom tailwindcss
```

## Styles

Import the shared Litomi UI styles and the reader styles once from your global CSS entry.

```css
@import 'tailwindcss';
@import '@litomi/ui/styles.css';
@import '@litomi/image-reader/styles.css';
```

`@litomi/ui/styles.css` provides shared theme tokens and safe-area utilities used by the reader controls. `@litomi/image-reader/styles.css` adds reader-specific utilities.

## Getting Started

```tsx
'use client'

import Reader, { type ReaderPage, type ReaderPageRenderContext } from '@litomi/image-reader'
import { useMemo, useState } from 'react'

type GalleryImage = {
  id: string
  src: string
  thumbnailSrc: string
  alt: string
}

type GalleryPage = ReaderPage & GalleryImage

type Props = {
  images: GalleryImage[]
}

export function GalleryReader({ images }: Props) {
  const [lastPage, setLastPage] = useState<number>()

  function renderPage({ fetchPriority, isLowDataMode, page }: ReaderPageRenderContext<GalleryPage>) {
    return (
      <img
        alt={page.alt}
        draggable={false}
        fetchPriority={fetchPriority}
        loading={fetchPriority === 'high' ? 'eager' : 'lazy'}
        src={isLowDataMode ? page.thumbnailSrc : page.src}
      />
    )
  }

  function renderThumbnail({ fetchPriority, page }: ReaderPageRenderContext<GalleryPage>) {
    return (
      <img
        alt={page.alt}
        className="h-full w-full object-cover"
        draggable={false}
        fetchPriority={fetchPriority}
        loading={fetchPriority === 'high' ? 'eager' : 'lazy'}
        src={page.thumbnailSrc}
      />
    )
  }

  return (
    <Reader
      locale="en"
      pages={images}
      pageSearchParam="page"
      persistenceKey="gallery-reader"
      readingProgress={{
        lastReadablePageNumber: lastPage,
        onChange: (progress) => setLastPage(progress.readablePageNumber),
      }}
      renderPage={renderPage}
      renderThumbnail={renderThumbnail}
    />
  )
}
```

## Core Concepts

### Pages

The reader accepts your own page objects as long as they extend `ReaderPage`.

```ts
type ReaderPage = {
  id: string
  progressMode?: 'count' | 'skip'
  spreadMode?: 'pairable' | 'solo'
}
```

- `id` must be stable and unique.
- `progressMode: 'count'` is the default behavior and includes the page in readable progress.
- `progressMode: 'skip'` is useful for ads, CTAs, end cards, and other utility pages.
- `spreadMode: 'pairable'` is the default behavior and allows the page to share a double-page spread.
- `spreadMode: 'solo'` always renders the page alone in double-page mode.

### Renderers

`renderPage` and `renderThumbnail` receive the same context:

```ts
type ReaderPageRenderContext<TPage extends ReaderPage> = {
  fetchPriority: 'high' | 'low'
  isActive: boolean
  isLowDataMode: boolean
  page: TPage
  pageIndex: number
  spreadIndex: number
}
```

Use `fetchPriority` and `isLowDataMode` to choose the right image source and loading strategy. The reader owns navigation and controls; your renderers own image markup, CDN URLs, responsive sources, placeholders, and alt text.

### Reading Progress

`readingProgress` lets your app persist progress without coupling the reader to a backend.

```tsx
<Reader
  readingProgress={{
    lastReadablePageNumber: 18,
    onChange: (progress) => {
      localStorage.setItem('last-page', String(progress.readablePageNumber))
    },
    onSave: async (progress, options) => {
      await fetch('/api/reading-progress', {
        method: 'POST',
        keepalive: options?.keepalive,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(progress),
      })
    },
  }}
  {...readerProps}
/>
```

- `onChange` runs when the active readable page changes.
- `onSave` runs periodically and when the page is hidden, unloaded, or the reader unmounts.
- `options.keepalive` is set for lifecycle saves so you can pass it to `fetch`.
- Skipped pages do not advance readable progress.

### Notices

Use `onNotice` to connect reader events to your app toast or notification system.

```tsx
<Reader
  onNotice={(notice) => {
    const id = showToast({
      action: notice.action,
      message: notice.message,
      severity: notice.severity,
    })

    return {
      dismiss: () => dismissToast(id),
    }
  }}
  {...readerProps}
/>
```

Notices include first page, last page, resume reading, slideshow completion, and automatic low-data mode detection.

### Localization

Built-in locale catalogs are available for:

- `ko`
- `en`
- `ja`
- `zh-CN`
- `zh-TW`

Unsupported locales fall back to Korean. Use `messages` to override labels without forking the package.

```tsx
<Reader
  locale="en"
  messages={{
    slideshowStartButton: 'Auto play',
  }}
  {...readerProps}
/>
```

## Production Best Practices

- Serve images from a CDN with responsive variants. Prefer `<picture>` or `srcSet` when you have multiple sizes.
- Use `fetchPriority` from the render context. Render active and near-active pages eagerly, and keep distant pages lazy.
- Use `isLowDataMode` to select thumbnail or compressed variants when the reader detects data saver mode or a slow network.
- Provide explicit image dimensions, aspect-ratio wrappers, or stable layout constraints to reduce layout shift.
- Keep `renderPage` and `renderThumbnail` pure and lightweight. Memoize page arrays and avoid creating large objects during render.
- Mark non-content pages with `progressMode: 'skip'` and `spreadMode: 'solo'` so progress and double-page layout stay correct.
- Make `onSave` idempotent and small. The reader saves every minute and again during lifecycle events.
- Pass `keepalive: options?.keepalive` to `fetch` for lifecycle saves, and keep the request body small enough for browser keepalive limits.
- Scope `persistenceKey` per product or reader experience, for example `my-app-reader-v1`, so settings from incompatible readers do not collide.
- Wire `onNotice` into your app-level toast system and return a `dismiss` handle when possible.
- Test touch, trackpad, wheel, keyboard, and mobile safe-area behavior before shipping.
- Import the CSS once globally. Duplicate imports can increase generated CSS and make theme overrides harder to reason about.
- Review the `GPL-3.0-only` license before distributing proprietary applications with this package.

## Long-Term Integration Notes

- Treat `ReaderPage` as an adapter shape at your UI boundary, not as your permanent domain model.
- Keep image URL generation outside the reader so CDN, authorization, and variant policy can evolve independently.
- Prefer message overrides for copy changes and localization tweaks instead of patching internal components.
- Version your `persistenceKey` when you intentionally reset stored reader settings.
- Keep `pageSearchParam` stable if users share reader URLs.
- Monitor bundle output after upgrades. The reader depends on React, `@litomi/ui`, `lucide-react`, `zustand`, `react-window`, and `react-intersection-observer`.
- Plan React and Tailwind major upgrades deliberately because they are peer dependencies and part of the public integration contract.
