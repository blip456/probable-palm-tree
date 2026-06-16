import { NextResponse } from "next/server";
import { getStoreStatus, checkConnection } from "@/lib/store";

export const dynamic = "force-dynamic";

// Diagnostic endpoint: reports whether Supabase is configured correctly and
// reachable. Visit /api/health after deploying to confirm your env vars and
// the `messages` table are wired up. Does not expose any secrets.
export async function GET() {
  const status = getStoreStatus();
  const connection = await checkConnection();

  return NextResponse.json(
    {
      ...status,
      connectionOk: connection.ok,
      connectionError: connection.error ?? null,
    },
    { status: connection.ok ? 200 : 503 }
  );
}
