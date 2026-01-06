import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computeMonthlyTrends,
  computeWeeklyTrends,
  getMonthlyReflections,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get("range");
  const range = rangeParam === "monthly" ? "monthly" : "allTime";

  const healer = await prisma.healer.findUnique({
    where: { slug },
    select: {
      reflections: {
        orderBy: { createdAt: "desc" },
        select: {
          grounded: true,
          supported: true,
          connected: true,
          createdAt: true,
        },
      },
    },
  });

  if (!healer) {
    return NextResponse.json({ error: "Healer not found" }, { status: 404 });
  }

  if (range === "monthly") {
    const monthlyReflections = getMonthlyReflections(healer.reflections);
    const trends = computeWeeklyTrends(monthlyReflections);
    return NextResponse.json({ trends });
  }

  const trends = computeMonthlyTrends(healer.reflections);
  return NextResponse.json({ trends });
}
