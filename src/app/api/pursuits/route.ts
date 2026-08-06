import { NextResponse } from "next/server";
import {
  clearPursuits,
  listPursuits,
  savePursuit,
} from "@/lib/pursuitStore";
import type { Pursuit } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ pursuits: await listPursuits() });
}

export async function POST(request: Request) {
  const pursuit = (await request.json()) as Pursuit;
  if (!pursuit?.id || !pursuit?.snapshot?.sourceUrl) {
    return NextResponse.json({ error: "Invalid pursuit" }, { status: 400 });
  }
  await savePursuit(pursuit);
  return NextResponse.json({ pursuit });
}

export async function DELETE() {
  await clearPursuits();
  return NextResponse.json({ cleared: true });
}
