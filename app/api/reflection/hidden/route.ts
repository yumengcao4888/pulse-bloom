import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const id = body?.id;
  const hidden = body?.hidden;

  if (!Number.isFinite(Number(id)) || typeof hidden !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = await prisma.reflection.update({
    where: { id: Number(id) },
    data: { hidden },
    select: { id: true, hidden: true },
  });

  return NextResponse.json({ reflection: updated });
}
