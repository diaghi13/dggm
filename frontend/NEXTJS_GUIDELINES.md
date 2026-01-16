# Next.js 16 App Router - Linee Guida Complete

**IMPORTANTE**: Questo file contiene le best practices ufficiali di Next.js 16 App Router.
Claude deve leggere e seguire queste linee guida per ogni modifica al frontend.

**Version**: Next.js 16.1+ (Gennaio 2025)
**Breaking Changes**: Next.js 16 ha cambiamenti BREAKING importanti rispetto a versioni precedenti.

---

## 🚨 BREAKING CHANGES Next.js 16 (LEGGI PRIMA)

### 1. Async Request APIs (OBBLIGATORIO)
**TUTTI questi API sono ora async e devono essere awaited**:
- `params` (in page.tsx, layout.tsx, route.ts)
- `searchParams` (in page.tsx)
- `cookies()`
- `headers()`
- `draftMode()`

```tsx
// ❌ SBAGLIATO (Next.js 15 e precedenti)
export default function Page({ params, searchParams }) {
  const id = params.id
  const cookieStore = cookies()
}

// ✅ CORRETTO (Next.js 16+)
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { id } = await params
  const search = await searchParams
  const cookieStore = await cookies()
  const headersList = await headers()
}
```

### 2. Nuovo Model di Caching: `'use cache'` (Opt-In)
**Caching è ora esplicitamente opt-in con la direttiva `'use cache'`**:

```tsx
// Abilita in next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
}

// Usa 'use cache' per cacheable components
export default async function ProductList() {
  'use cache'
  cacheLife('max')  // o 'hours', 'days', etc.

  const products = await db.products.findMany()
  return <List items={products} />
}
```

### 3. middleware.ts → proxy.ts
`middleware.ts` è deprecato, rinomina in `proxy.ts`:

```ts
// ✅ proxy.ts (nuovo)
export function proxy(request: NextRequest) {
  // Logica di routing
}
```

### 4. Requisiti Versione
- **Node.js**: 20.9.0+ (18.x non più supportato)
- **TypeScript**: 5.1.0+
- **React**: 19.2+ (incluso automaticamente)

---

## 1. Filosofia Fondamentale

### Principi Core (da seguire SEMPRE)
1. **Server-first by default** - Usa Server Components a meno che non serva interattività
2. **Fetch data sul server** - Mantieni API keys e secrets sicuri
3. **Minimizza JavaScript client-side** - Migliora performance e SEO
4. **Streaming progressivo** - Mostra loading states con Suspense
5. **Type-safe ovunque** - TypeScript strict mode abilitato
6. **Caching esplicito** - Usa `'use cache'` invece di caching implicito (Next.js 16+)

---

## 2. Server Components vs Client Components

### 🔑 REGOLA D'ORO
**Usa Server Components di default. Usa Client Components SOLO quando serve interattività o browser APIs.**

### Quando usare Server Components (default)
✅ Fetch da database o API
✅ Mantenere secrets sicuri (API keys, tokens)
✅ Ridurre JavaScript bundle
✅ Migliorare First Contentful Paint
✅ Streaming progressivo del contenuto

### Quando usare Client Components (`'use client'`)
✅ Serve **state** e **event handlers** (`onClick`, `onChange`, `onSubmit`)
✅ Serve **lifecycle logic** (`useEffect`, `useCallback`, `useMemo`)
✅ Serve **browser APIs** (`localStorage`, `window`, `geolocation`)
✅ Serve **custom hooks** (qualsiasi hook React)

### ⚠️ Best Practices Critiche

**1. Posiziona `'use client'` il più in basso possibile**
```tsx
// ❌ SBAGLIATO - Rende tutto client-side
'use client'
export default function Layout({ children }) {
  return <div>{children}</div>
}

// ✅ CORRETTO - Solo componenti interattivi
// app/layout.tsx (Server Component)
import SearchBox from './search-box'  // 'use client'
import Header from './header'         // Server Component

export default function Layout({ children }) {
  return (
    <>
      <Header />        {/* Server */}
      <SearchBox />     {/* Client */}
      {children}
    </>
  )
}
```

**2. Passa dati dal Server al Client via props**
```tsx
// app/posts/[id]/page.tsx (Server Component)
import LikeButton from '@/components/like-button'  // Client
import { getPost } from '@/lib/data'

type Props = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const { id } = await params  // ⚠️ Next.js 16: params è async!
  const post = await getPost(id)  // Server-side fetch

  return (
    <article>
      <h1>{post.title}</h1>
      <LikeButton initialLikes={post.likes} postId={post.id} />
    </article>
  )
}
```

**3. Interlaccia Server e Client Components**
Passa Server Components come children ai Client Components:

```tsx
// components/modal.tsx
'use client'

export default function Modal({ children }: { children: React.ReactNode }) {
  return <div className="modal">{children}</div>
}

// app/page.tsx (Server Component)
import Modal from './modal'
import ServerContent from './server-content'  // Server Component

export default function Page() {
  return (
    <Modal>
      <ServerContent />  {/* Server Component dentro Client Component */}
    </Modal>
  )
}
```

**4. Proteggi codice server-only**
```tsx
// lib/data.ts
import 'server-only'  // Previene import client-side

export async function getData() {
  const res = await fetch('https://api.example.com/data', {
    headers: {
      authorization: process.env.API_KEY  // Protetto da client
    }
  })
  return res.json()
}
```

**5. Context Providers sono sempre Client Components**
```tsx
// app/providers.tsx
'use client'

import { createContext } from 'react'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      {children}
    </ThemeProvider>
  )
}

// app/layout.tsx (Server Component)
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## 3. Data Fetching Patterns

### ⚡ Approccio Raccomandato: Server Components + `'use cache'`

**Next.js 16**: Il caching è ora **opt-in esplicito** con la direttiva `'use cache'`.

```tsx
// app/blog/page.tsx
import { cacheLife } from 'next/cache'

export default async function BlogList() {
  'use cache'
  cacheLife('max')  // Profilo cache: max, hours, days, etc.

  const res = await fetch('https://api.vercel.app/blog')
  const posts = await res.json()

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Nuovo Modello Caching Next.js 16

**Tre tipi di caching**:

1. **`'use cache'`** - Caching in-memory standard
```tsx
export default async function Page() {
  'use cache'
  cacheLife('max')  // Cache a lungo termine
  const data = await getData()
  return <div>{data}</div>
}
```

2. **`'use cache: remote'`** - Cache in remote cache (es. Redis)
```tsx
export default async function Page() {
  'use cache: remote'
  cacheLife('days')  // Cache distribuita
  const data = await getData()
  return <div>{data}</div>
}
```

3. **`'use cache: private'`** - Cache browser-only (no server persistence)
```tsx
export default async function Page() {
  'use cache: private'
  const cookieStore = await cookies()  // Accessibile in cache private
  const user = await getUser(cookieStore)
  return <div>{user.name}</div>
}
```

### Fetch API (Legacy, ma ancora supportato)

```tsx
// Cache indefinitamente (fino a revalidation)
fetch(url, { cache: 'force-cache' })

// Fetch fresh ogni volta
fetch(url, { cache: 'no-store' })

// Revalidate dopo 60 secondi
fetch(url, { next: { revalidate: 60 } })

// On-demand revalidation con tags
import { revalidateTag } from 'next/cache'
fetch(url, { next: { tags: ['posts'] } })
// Poi: revalidateTag('posts')
```

**⚠️ Raccomandazione Next.js 16**: Preferisci `'use cache'` + `cacheLife()` al vecchio `fetch()` con opzioni cache.

### Deduplication & Request Memoization

Next.js deduplica automaticamente le fetch request:

```tsx
import { cache } from 'react'

// Wrappa chiamate ORM/database per deduplicazione
const getPost = cache(async (slug: string) => {
  return await db.posts.findFirst({ where: { slug } })
})

export default async function Page() {
  const post1 = await getPost('hello')  // Esegue query
  const post2 = await getPost('hello')  // Riusa risultato
  return <div>{post1.title}</div>
}
```

### Pattern di Fetching

**Sequential** (una richiesta dipende dall'altra):
```tsx
// ❌ Blocca tutto
async function Page() {
  const user = await getUser()
  const posts = await getPosts(user.id)  // Aspetta user
  return <div>...</div>
}

// ✅ Usa Suspense per non bloccare
import { Suspense } from 'react'

<Suspense fallback={<UserSkeleton />}>
  <User />
</Suspense>
<Suspense fallback={<PostsSkeleton />}>
  <Posts />
</Suspense>
```

**Parallel** (richieste indipendenti):
```tsx
async function Dashboard() {
  // Avvia entrambe simultaneamente
  const [user, analytics] = await Promise.all([
    getUser(userId),
    getAnalytics(userId)
  ])
  return <div>...</div>
}
```

**Preloading** (inizia fetch prima del rendering):
```tsx
const preloadUser = (id: string) => {
  void getUser(id)  // Avvia fetch senza await
}

export default function Page() {
  return (
    <button onMouseEnter={() => preloadUser('123')}>
      Hover to preload
    </button>
  )
}
```

### ⚡ Streaming con Suspense

```tsx
import { Suspense } from 'react'

export default function Dashboard() {
  return (
    <>
      <Header />
      <Suspense fallback={<SkeletonList />}>
        <DataTable />  {/* Streamed quando pronto */}
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <Chart />      {/* Streamed quando pronto */}
      </Suspense>
    </>
  )
}
```

**loading.js per route segments**:
```tsx
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return <DashboardSkeleton />
}

// app/dashboard/page.tsx
export default async function Page() {
  const data = await getData()  // Mostra loading.tsx durante fetch
  return <div>{data}</div>
}
```

---

## 4. Route Handlers & API Routes

Route Handlers = API routes nell'App Router (Web Request/Response APIs).

### Struttura Base

```ts
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const posts = await db.posts.findMany()
  return NextResponse.json({ posts })
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  const post = await db.posts.create({ data })
  return NextResponse.json({ post }, { status: 201 })
}
```

### Metodi HTTP Supportati
GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS

### Best Practices

**1. Caching Strategy**
```ts
// app/api/items/route.ts
export const dynamic = 'force-static'  // Caching per GET

export async function GET() {
  const items = await db.items.findMany()
  return NextResponse.json(items)
}
```

**2. Type-Safe Route Handlers**
```ts
import type { NextRequest } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params
  const item = await db.items.findUnique({ where: { id } })
  return NextResponse.json({ item })
}
```

**3. Error Handling**
```ts
export async function GET() {
  try {
    const data = await fetchData()
    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
```

**4. ⚠️ IMPORTANTE: Evita fetch verso API route proprie**
```tsx
// ❌ SBAGLIATO - Network hop inutile
export default async function Page() {
  const res = await fetch('http://localhost:3000/api/posts')
  const posts = await res.json()
  return <ul>{posts.map(...)}</ul>
}

// ✅ CORRETTO - Accesso diretto a DB
export default async function Page() {
  const posts = await db.posts.findMany()
  return <ul>{posts.map(...)}</ul>
}
```

---

## 5. Performance Optimization

### Image Optimization con `next/image`

```tsx
import Image from 'next/image'

export default function Hero() {
  return (
    <Image
      src="/hero.png"
      alt="Hero banner"
      width={1920}
      height={1080}
      priority={true}        // Per immagini above-the-fold
      quality={75}           // 0-100, default 75
      placeholder="blur"     // Blur durante loading
    />
  )
}
```

**Benefici automatici**:
- Resize e conversione formato (WebP, AVIF)
- Lazy loading di default
- Responsive con srcSet
- 40-70% compressione
- Previene layout shifts

### Font Optimization con `next/font`

```tsx
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const playfair = Playfair_Display({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="it" className={inter.className}>
      <body>
        <h1 className={playfair.className}>Titolo</h1>
        {children}
      </body>
    </html>
  )
}
```

**Benefici**:
- Zero layout shift
- Self-hosted automaticamente
- Nessuna richiesta esterna a Google Fonts

### Code Splitting & Lazy Loading

```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./heavy'), {
  loading: () => <div>Loading...</div>,
  ssr: false  // Solo client-side se necessario
})

export default function Page() {
  return <HeavyComponent />
}
```

---

## 6. TypeScript Patterns

### Enable Strict Mode (OBBLIGATORIO)

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### Type-Safe Page & Layout Props

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  return { title: post.title }
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  return <article>{post.content}</article>
}
```

### Typed Environment Variables

```ts
// lib/env.ts
export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY ?? '',
} as const satisfies Record<string, string>
```

---

## 7. Metadata & SEO

### Static Metadata

```tsx
// app/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DGGM ERP',
  description: 'Sistema gestionale per aziende edili',
  keywords: ['erp', 'gestionale', 'edilizia'],
  openGraph: {
    title: 'DGGM ERP',
    description: 'Sistema gestionale per aziende edili',
    url: 'https://example.com',
    images: [{ url: 'https://example.com/og.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
  }
}

export default function Page() {
  return <div>...</div>
}
```

### Dynamic Metadata con `generateMetadata`

```tsx
import type { Metadata, ResolvingMetadata } from 'next'
import { cache } from 'react'

// Memoize per riutilizzo in Page
const getPost = cache(async (slug: string) => {
  return await db.posts.findFirst({ where: { slug } })
})

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)  // Memoized
  const parentImages = (await parent).openGraph?.images || []

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      images: [post.coverImage, ...parentImages],
    }
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)  // Riusa chiamata memoizzata
  return <article>{post.content}</article>
}
```

### Dynamic OG Images

```tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  return new ImageResponse(
    <div style={{
      fontSize: 128,
      background: 'white',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {post.title}
    </div>
  )
}
```

---

## 8. Common Pitfalls & Anti-Patterns

### ❌ 1. `'use client'` troppo in alto

```tsx
// ❌ SBAGLIATO
'use client'
export default function Layout({ children }) {
  return <div>{children}</div>  // Tutto diventa client-side!
}

// ✅ CORRETTO
// Solo componenti interattivi hanno 'use client'
import SearchBox from './search-box'  // 'use client' dentro
```

### ❌ 2. Fetch verso API route proprie

```tsx
// ❌ SBAGLIATO - Network hop inutile
export default async function Page() {
  const res = await fetch('http://localhost:3000/api/posts')
  return <div>{JSON.stringify(res)}</div>
}

// ✅ CORRETTO - Accesso diretto
import { getPosts } from '@/lib/data'

export default async function Page() {
  const posts = await getPosts()
  return <div>{JSON.stringify(posts)}</div>
}
```

### ❌ 3. Dimenticare opt-out caching per dati real-time

```tsx
// ❌ SBAGLIATO - Dati stale
const data = await fetch('https://api.example.com/live')

// ✅ CORRETTO
const data = await fetch('https://api.example.com/live', {
  cache: 'no-store'  // Fresh ogni volta
})

// OPPURE
const data = await fetch('https://api.example.com/live', {
  next: { revalidate: 60 }  // Revalidate ogni 60s
})
```

### ❌ 4. Esporre codice server al client

```tsx
// ❌ SBAGLIATO - API key esposta!
'use client'
export function Component() {
  const apiKey = process.env.SECRET_API_KEY  // NO!!!
  // ...
}

// ✅ CORRETTO - Server-only
import 'server-only'

export async function getData() {
  const res = await fetch('https://api.example.com', {
    headers: { 'API-Key': process.env.SECRET_API_KEY }  // Sicuro
  })
  return res.json()
}
```

### ❌ 5. Troppo state in page components

```tsx
// ❌ SBAGLIATO - Tutto re-renderizza
'use client'
export default function Page() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <HeavyComponent />  {/* Re-renderizza ad ogni click! */}
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  )
}

// ✅ CORRETTO - Isola state
function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

export default function Page() {
  return (
    <>
      <HeavyComponent />  {/* Non re-renderizza */}
      <Counter />
    </>
  )
}
```

---

## 9. Routing & File Conventions

### Special Files

| File | Scopo |
|------|-------|
| `layout.tsx` | Shared UI (header, nav, footer) |
| `page.tsx` | Rende la route pubblica |
| `loading.tsx` | Loading UI (Suspense automatico) |
| `error.tsx` | Error boundary |
| `not-found.tsx` | UI per 404 |
| `route.ts` | API endpoint |

### Route Organization

**Private folders** (prefisso `_`):
```
app/dashboard/_components/Header.tsx  # Non routable
app/dashboard/_lib/utils.ts           # Non routable
```

**Route groups** (parentesi):
```
app/(marketing)/about/page.tsx  # URL: /about
app/(shop)/cart/page.tsx        # URL: /cart
```

**Dynamic routes**:
```
app/blog/[slug]/page.tsx         # /blog/my-post
app/shop/[...slug]/page.tsx      # /shop/a/b/c (catch-all)
app/docs/[[...slug]]/page.tsx    # /docs o /docs/a/b (optional)
```

---

## 10. Quick Reference per Claude

### Checklist per ogni componente

- [ ] È Server Component di default?
- [ ] Se `'use client'`, è davvero necessario?
- [ ] Fetch dati sul server quando possibile?
- [ ] Dark mode supportato con `dark:` classes?
- [ ] TypeScript strict (no `any`)?
- [ ] Accessibilità (ARIA labels, keyboard nav)?
- [ ] Image con `next/image`?
- [ ] Metadata SEO definita?

### Pattern da Preferire

✅ Server Components per data fetching
✅ `next/image` per tutte le immagini
✅ `next/font` per fonts
✅ Suspense per streaming
✅ Dynamic imports per componenti pesanti
✅ `cache()` per memoizzazione
✅ `'server-only'` per codice sensibile

### Pattern da Evitare

❌ `'use client'` troppo in alto
❌ Fetch verso proprie API routes
❌ `any` in TypeScript
❌ Dimenticare dark mode
❌ Componenti non accessibili
❌ Layout shifts (usa width/height)
❌ Esporre secrets al client

---

---

## 11. Novità Next.js 16 (Gennaio 2025)

### Turbopack Stabile (Default)
- **10x** faster Fast Refresh in sviluppo
- **2-5x** faster production builds
- Ora default per `next dev` e `next build`

### React 19.2 Support
- View Transitions API
- `useEffectEvent` hook
- Activity API
- React Compiler stabile (auto-memoization)

### Next.js DevTools MCP
- Integrazione Model Context Protocol per AI-assisted debugging
- Insight contestuale sull'applicazione

### Migration da Next.js 15

**Automated Upgrade**:
```bash
npx @next/codemod@canary upgrade latest
```

**Manuale**:
```bash
npm install next@latest react@latest react-dom@latest
```

**Codemods Disponibili**:
- Async Dynamic APIs migration
- middleware.ts → proxy.ts
- Caching model migration

---

## 📚 Fonti & Documentazione

### Documentazione Ufficiale
- [Next.js 16 Release](https://nextjs.org/blog/next-16)
- [App Router Documentation](https://nextjs.org/docs/app)
- [Upgrading to Version 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [`use cache` Directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [Cache Components Guide](https://nextjs.org/docs/app/getting-started/cache-components)
- [Async Dynamic APIs](https://nextjs.org/docs/messages/sync-dynamic-apis)

### Community Resources
- [Next.js 16 Migration Guide](https://michaelpilgram.co.uk/blog/migrating-to-nextjs-16)
- [Production Migration Experiences](https://www.amillionmonkeys.co.uk/blog/migrating-to-nextjs-16-production-guide)
- [Complete Next.js 16 Guide](https://codelynx.dev/posts/nextjs-16-complete-guide)

---

**Ultimo Aggiornamento**: Gennaio 2025
**Next.js Version**: 16.1+
**React Version**: 19.2+
**Node.js Minimum**: 20.9.0
