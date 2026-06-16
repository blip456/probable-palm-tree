import { NextResponse } from "next/server";
import { getMessage } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { passphrase: string } }
) {
  const passphrase = decodeURIComponent(params.passphrase ?? "");

  if (!passphrase.trim()) {
    return NextResponse.json(
      { error: "A passphrase is required." },
      { status: 400 }
    );
  }

  try {
    const stored = await getMessage(passphrase);

    if (!stored) {
      return NextResponse.json(
        { error: "No data found for that passphrase." },
        { status: 404 }
      );
    }

    return NextResponse.json(stored, { status: 200 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Could not fetch message: ${detail}` },
      { status: 500 }
    );
  }
}
