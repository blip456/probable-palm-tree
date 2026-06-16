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

## Storage note

Data is kept in an **in-memory** `Map` (see `lib/store.ts`). This is great for a
demo, but on Vercel/serverless the store is per-instance and is cleared on cold
starts, so it is **not durable**. To persist data, replace the implementation in
`lib/store.ts` with a real database (e.g. Vercel KV, Postgres, or Redis) — the
rest of the app only depends on the `saveMessage` / `getMessage` functions.

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
