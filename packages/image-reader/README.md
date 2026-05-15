# @litomi/image-reader

Image reader components for Next.js, React, TypeScript, and Tailwind CSS.

## Requirements

- Next.js 16 or newer
- React 19 or newer
- Tailwind CSS 4 or newer
- `@litomi/ui`

## Usage

```tsx
import Reader, { type ReaderPageRenderContext } from '@litomi/image-reader'
```

Because Tailwind CSS ignores dependencies by default, register this package and `@litomi/ui` as explicit sources in your app stylesheet:

```css
@import 'tailwindcss';

@source '../node_modules/@litomi/image-reader/dist';
@source '../node_modules/@litomi/ui/dist';
```

Adjust the paths relative to the stylesheet that imports Tailwind CSS.
