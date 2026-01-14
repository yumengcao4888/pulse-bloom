import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateSlugFromName } from "@/lib/slug";

const MAX_ATTEMPTS = 50;

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const healer = await prisma.healer.findUnique({
      where: { clerkId: userId },
      select: { id: true, name: true, slug: true },
    });

    if (!healer) {
      return NextResponse.json({ error: "Healer not found" }, { status: 404 });
    }

    let nextSlug: string | null = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = generateSlugFromName(healer.name);
      if (candidate === healer.slug) {
        continue;
      }
      const existing = await prisma.healer.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing) {
        nextSlug = candidate;
        break;
      }
    }

    if (!nextSlug) {
      return NextResponse.json(
        { error: "Unable to generate a unique slug" },
        { status: 500 },
      );
    }

    await prisma.healer.update({
      where: { id: healer.id },
      data: { slug: nextSlug },
    });

    return NextResponse.json({ success: true, slug: nextSlug }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/healer/slug:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}
