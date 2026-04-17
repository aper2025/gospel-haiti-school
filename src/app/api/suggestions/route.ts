import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { authorName, authorEmail, category, body } = await request.json();

  if (!body || typeof body !== "string" || body.trim().length === 0) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      authorName: authorName || null,
      authorEmail: authorEmail || null,
      category: category || "other",
      body: body.trim(),
    },
  });

  return NextResponse.json({ ok: true, id: suggestion.id });
}

export async function GET() {
  const suggestions = await prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suggestions);
}
