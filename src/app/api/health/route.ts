import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let db: "ok" | "error" = "ok";
  let dbError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    db = "error";
    dbError = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json({
    status: db === "ok" ? "ok" : "degraded",
    db,
    dbError,
    elapsedMs: Date.now() - started,
    timestamp: new Date().toISOString(),
  });
}
