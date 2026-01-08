import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const id = body?.id;
  const heard = body?.heard;

  if (!Number.isFinite(Number(id)) || typeof heard !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = await prisma.reflection.update({
    where: { id: Number(id) },
    data: { heardAt: heard ? new Date() : null },
    select: { id: true, heardAt: true },
  });

  return NextResponse.json({ reflection: updated });
}
