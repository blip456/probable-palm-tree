import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Storage for messages, keyed by a generated passphrase.
//
// Primary backend is Supabase (hosted Postgres) so data is durable and shared
// across all serverless instances on Vercel. If the Supabase env vars are not
// configured (e.g. local dev without credentials) we transparently fall back to
// an in-memory Map so the app still runs — but note that the in-memory store is
// per-instance and NOT shared across Vercel invocations.

export type StoredMessage = {
  name: string;
  message: string;
  createdAt: string;
};

const TABLE = "messages";

// ---------------------------------------------------------------------------
// Supabase client (server-side only — uses the service role key)
// ---------------------------------------------------------------------------
// Normalize the URL: trim whitespace and strip any trailing slash so the
// Supabase client builds a clean `${url}/rest/v1/...` endpoint.
const SUPABASE_URL = (
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  ""
)
  .trim()
  .replace(/\/+$/, "");
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  ""
).trim();

// Validate that the URL looks like a Supabase project API URL
// (https://<ref>.supabase.co) and NOT, say, the dashboard URL.
function describeUrlProblem(url: string): string | null {
  if (!url) return null; // handled by the fallback path below
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return `SUPABASE_URL is not a valid URL: "${url}"`;
  }
  if (parsed.protocol !== "https:") {
    return `SUPABASE_URL must start with https:// (got "${parsed.protocol}")`;
  }
  if (parsed.hostname.endsWith(".supabase.com")) {
    const ref = parsed.hostname.replace(/\.supabase\.com$/, "");
    return `SUPABASE_URL host ends in ".supabase.com" but project API URLs end in ".supabase.co". Use "https://${ref}.supabase.co".`;
  }
  if (parsed.hostname === "supabase.com" || parsed.hostname === "www.supabase.com") {
    return 'SUPABASE_URL looks like a dashboard URL. Use the project API URL "https://<project-ref>.supabase.co" from Settings → API, not the supabase.com dashboard link.';
  }
  if (parsed.pathname && parsed.pathname !== "/") {
    return `SUPABASE_URL should have no path. Use just "https://<project-ref>.supabase.co" (got path "${parsed.pathname}")`;
  }
  return null;
}

const urlProblem = describeUrlProblem(SUPABASE_URL);

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  if (urlProblem) {
    console.error(`[store] ${urlProblem}`);
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
} else if (process.env.NODE_ENV === "production") {
  // Surface a clear warning in production logs if storage isn't configured.
  console.warn(
    "[store] Supabase env vars are not set; falling back to in-memory storage. " +
      "Data will NOT persist across serverless instances on Vercel."
  );
}

// Diagnostics exposed via the /api/health endpoint.
export function getStoreStatus() {
  return {
    backend: supabase ? "supabase" : "in-memory",
    supabaseUrlSet: Boolean(SUPABASE_URL),
    supabaseKeySet: Boolean(SUPABASE_KEY),
    supabaseHost: SUPABASE_URL ? new URL(SUPABASE_URL).hostname : null,
    urlProblem,
  };
}

export async function checkConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!supabase) {
    return { ok: false, error: "Supabase not configured (using in-memory)." };
  }
  try {
    const { error } = await supabase
      .from(TABLE)
      .select("passphrase", { count: "exact", head: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// In-memory fallback store (persisted on globalThis to survive HMR in dev)
// ---------------------------------------------------------------------------
const globalForStore = globalThis as unknown as {
  __messageStore?: Map<string, StoredMessage>;
};
const memoryStore: Map<string, StoredMessage> =
  globalForStore.__messageStore ?? new Map<string, StoredMessage>();
if (!globalForStore.__messageStore) {
  globalForStore.__messageStore = memoryStore;
}

// ---------------------------------------------------------------------------
// Passphrase generation — human-friendly, e.g. "brave-amber-otter-72"
// ---------------------------------------------------------------------------
const ADJECTIVES = [
  "brave", "calm", "clever", "eager", "gentle", "happy", "jolly", "kind",
  "lucky", "mighty", "noble", "proud", "quiet", "swift", "witty", "bright",
];

const COLORS = [
  "amber", "azure", "coral", "crimson", "emerald", "golden", "indigo",
  "ivory", "jade", "scarlet", "silver", "teal", "violet", "olive",
];

const ANIMALS = [
  "otter", "falcon", "panda", "tiger", "lynx", "heron", "bison", "koala",
  "raven", "moose", "gecko", "marten", "badger", "puffin", "wombat",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generatePassphrase(): string {
  const number = Math.floor(Math.random() * 90) + 10; // 10-99
  return `${pick(ADJECTIVES)}-${pick(COLORS)}-${pick(ANIMALS)}-${number}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function saveMessage(
  name: string,
  message: string
): Promise<string> {
  if (supabase) {
    // Retry on the (rare) chance of a passphrase collision (PK violation).
    for (let attempt = 0; attempt < 5; attempt++) {
      const passphrase = generatePassphrase();
      const { error } = await supabase
        .from(TABLE)
        .insert({ passphrase, name, message });

      if (!error) {
        return passphrase;
      }
      // 23505 = unique_violation; regenerate and try again.
      if (error.code !== "23505") {
        throw new Error(`Failed to save message: ${error.message}`);
      }
    }
    throw new Error("Could not generate a unique passphrase. Please retry.");
  }

  // In-memory fallback.
  let passphrase = generatePassphrase();
  while (memoryStore.has(passphrase)) {
    passphrase = generatePassphrase();
  }
  memoryStore.set(passphrase, {
    name,
    message,
    createdAt: new Date().toISOString(),
  });
  return passphrase;
}

export async function getMessage(
  passphrase: string
): Promise<StoredMessage | undefined> {
  const key = passphrase.trim().toLowerCase();

  if (supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("name, message, created_at")
      .eq("passphrase", key)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch message: ${error.message}`);
    }
    if (!data) {
      return undefined;
    }
    return {
      name: data.name,
      message: data.message,
      createdAt: data.created_at,
    };
  }

  return memoryStore.get(key);
}
