import { NextResponse } from "next/server";
import { saveMessage } from "@/lib/store";

// In-memory store is per-instance; don't try to statically optimize this.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { name, message } = (body ?? {}) as {
    name?: unknown;
    message?: unknown;
  };

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "A non-empty 'name' is required." },
      { status: 400 }
    );
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "A non-empty 'message' is required." },
      { status: 400 }
    );
  }

  const passphrase = saveMessage(name.trim(), message.trim());

  return NextResponse.json({ passphrase }, { status: 201 });
}
