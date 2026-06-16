// Simple in-memory store for messages, keyed by a generated passphrase.
//
// NOTE ON PERSISTENCE: This uses an in-memory Map. On Vercel (or any
// serverless platform) the store lives inside a single function instance and
// is NOT shared across instances, and it is cleared on cold starts. That is
// fine for a demo / prototype as requested. For durable storage, swap the
// implementation in this file for a real database (e.g. Vercel KV, Postgres,
// Redis) — the rest of the app only depends on the exported functions below.

export type StoredMessage = {
  name: string;
  message: string;
  createdAt: string;
};

// Persist the Map on globalThis so it survives module reloads during
// development (Next.js hot-reloading otherwise resets module-level state).
const globalForStore = globalThis as unknown as {
  __messageStore?: Map<string, StoredMessage>;
};

const store: Map<string, StoredMessage> =
  globalForStore.__messageStore ?? new Map<string, StoredMessage>();

if (!globalForStore.__messageStore) {
  globalForStore.__messageStore = store;
}

// Word lists used to build a human-friendly, memorable passphrase such as
// "brave-amber-otter-72".
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

export function saveMessage(name: string, message: string): string {
  // Make sure the passphrase is unique within the store.
  let passphrase = generatePassphrase();
  while (store.has(passphrase)) {
    passphrase = generatePassphrase();
  }

  store.set(passphrase, {
    name,
    message,
    createdAt: new Date().toISOString(),
  });

  return passphrase;
}

export function getMessage(passphrase: string): StoredMessage | undefined {
  return store.get(passphrase.trim().toLowerCase());
}
