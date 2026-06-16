# probable-palm-tree

A small Next.js (App Router) + React app, deployable to Vercel, that lets you:

- **Send data** — submit your **name** and a **free-text message**. The backend
  stores it and returns a **passphrase**.
- **Fetch data** — enter a passphrase to retrieve the previously stored data.

## How it works

| Part | Location |
| --- | --- |
| Frontend (both forms) | `app/page.tsx` |
| Store endpoint (`POST`) | `app/api/messages/route.ts` |
| Retrieve endpoint (`GET`) | `app/api/messages/[passphrase]/route.ts` |
| Storage + passphrase generation | `lib/store.ts` |
| Database schema | `supabase/schema.sql` |

### API

```
POST /api/messages
  body: { "name": string, "message": string }
  201:  { "passphrase": "brave-amber-otter-72" }

GET /api/messages/:passphrase
  200:  { "name": string, "message": string, "createdAt": string }
  404:  { "error": "No data found for that passphrase." }
```

Passphrases look like `brave-amber-otter-72` — easy to read and share.

## Storage (Supabase)

Data is stored in **Supabase** (hosted Postgres) so it is durable and shared
across all serverless instances on Vercel. The app reads/writes from server-side
API routes using the Supabase **service role** key.

> If the Supabase env vars are not set, the app falls back to a per-instance
> **in-memory** store. That's fine locally, but on Vercel it is *not* shared
> across instances — which is exactly why a `POST` could succeed yet the matching
> `GET` returned "no data". Configure Supabase to fix that.

### Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor** and run the contents of
   [`supabase/schema.sql`](supabase/schema.sql) to create the `messages` table.
3. In **Settings → API**, copy the **Project URL** and the **service_role** key.
4. Set these environment variables (see [`.env.example`](.env.example)):

   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   - **Locally:** put them in a `.env.local` file.
   - **On Vercel:** add them in **Project → Settings → Environment Variables**,
     then **redeploy**.

The `service_role` key is secret and used only on the server — never prefix it
with `NEXT_PUBLIC_` and never expose it to the browser.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm start        # run the production build locally
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Next.js — no extra configuration needed. Deploy.
