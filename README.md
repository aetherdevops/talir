# Talir

Macedonian Stock Exchange tracker built with Next.js. Market data is bundled as static JSON; auth, alerts, portfolios, and watchlists sync through Supabase.

## Local preview (before pushing)

Use this workflow whenever you want to see changes on your machine first.

### 1. One-time setup

```bash
npm run setup
```

This installs dependencies (if needed) and creates `.env.local` from `.env.example`.

### 2. Configure Supabase

Edit `.env.local` with values from **Supabase → Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

In **Supabase → Authentication → URL configuration**, add:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

Run the user-data migration once in the **SQL Editor**:

- `supabase/migrations/001_user_data.sql`

### 3. Start the app

```bash
npm run preview
```

`preview` checks your local env, then starts the dev server at [http://localhost:3000](http://localhost:3000).

After the first setup, you can also use:

```bash
npm run dev
```

`dev` runs the same env check automatically (`predev`).

### 4. What to try locally

- Browse stocks, indices, and charts (works without logging in)
- Register / log in at `/register` and `/login`
- Create alerts, portfolios, and watchlists (requires login)
- Confirm data persists after refresh when signed in

### 5. Before pushing to GitHub

```bash
npm run build
```

Fix any build errors, then commit and push. Vercel will deploy from `main`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run setup` | Install deps and create `.env.local` |
| `npm run preview` | Env check + local dev server |
| `npm run dev` | Local dev server (env check via `predev`) |
| `npm run build` | Production build (run before push) |
| `npm run lint` | ESLint |

## Deploy

Production runs on Vercel. Set the same Supabase env vars there and use your production domain in Supabase auth redirect URLs.
