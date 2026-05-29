# CraftCapture Brand Assets

## Files
| File | Size | Usage |
|------|------|-------|
| `favicon.svg` | 32×32 | Primary favicon (modern browsers) |
| `favicon.ico` | 16/32/48px | Legacy favicon fallback |
| `apple-touch-icon.png` | 180×180 | iOS home screen icon |
| `icon-192x192.png` | 192×192 | PWA manifest icon |
| `icon-512x512.png` | 512×512 | PWA manifest icon |
| `og-image.png` | 1200×630 | Social share / og:image |
| `logo-light.svg` | 280×48 | Horizontal logo on light backgrounds |
| `logo-dark.svg` | 280×48 | Horizontal logo on dark/navy backgrounds |
| `icon-mark.svg` | 32×32 | Standalone mark (no background) |

## Next.js setup — app/layout.tsx
```ts
export const metadata: Metadata = {
  title: 'CraftCapture',
  description: 'The business platform for trade contractors',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}
```

Drop all files into your `/public` folder.

## Colors
- Orange: `#f97316`
- Navy: `#0F1628`
- Font: Sora 600 (already in your project)
