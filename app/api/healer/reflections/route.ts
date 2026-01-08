import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const healer = await prisma.healer.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!healer) {
      return NextResponse.json({ error: "Healer not found" }, { status: 404 });
    }

    const result = await prisma.reflection.deleteMany({
      where: { healerId: healer.id },
    });

    return NextResponse.json(
      { success: true, deletedReflections: result.count },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error in /api/healer/reflections DELETE:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}
