import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SyncEntry = {
  clientUuid: string;
  studentId: string;
  date: string;
  code: string;
  markedById: string;
  notes?: string;
};

export async function POST(request: Request) {
  // Verify auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { entries } = (await request.json()) as { entries: SyncEntry[] };
  if (!entries?.length) {
    return NextResponse.json({ synced: [] });
  }

  const synced: string[] = [];
  const errors: { clientUuid: string; error: string }[] = [];

  for (const entry of entries) {
    try {
      await prisma.attendance.upsert({
        where: { clientUuid: entry.clientUuid },
        update: {
          code: entry.code as never,
          notes: entry.notes || null,
          syncedAt: new Date(),
        },
        create: {
          studentId: entry.studentId,
          date: new Date(entry.date),
          code: entry.code as never,
          notes: entry.notes || null,
          markedById: entry.markedById,
          clientUuid: entry.clientUuid,
          syncedAt: new Date(),
        },
      });
      synced.push(entry.clientUuid);
    } catch (e) {
      // Duplicate student+date — update instead
      try {
        await prisma.attendance.update({
          where: {
            studentId_date: {
              studentId: entry.studentId,
              date: new Date(entry.date),
            },
          },
          data: {
            code: entry.code as never,
            notes: entry.notes || null,
            syncedAt: new Date(),
          },
        });
        synced.push(entry.clientUuid);
      } catch {
        errors.push({
          clientUuid: entry.clientUuid,
          error: e instanceof Error ? e.message : "unknown",
        });
      }
    }
  }

  return NextResponse.json({ synced, errors });
}
