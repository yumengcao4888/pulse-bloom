import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWeeklyTrends } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const timeZone = searchParams.get("tz") ?? undefined;
  if (timeZone && !isValidTimeZone(timeZone)) {
    return NextResponse.json({ error: "Invalid time zone" }, { status: 400 });
  }

  const healer = await prisma.healer.findUnique({
    where: { slug },
    include: {
      reflections: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!healer) {
    return NextResponse.json({ error: "Healer not found" }, { status: 404 });
  }

  const reflections = healer.reflections.map((reflection) => ({
    ...reflection,
    sentiment: null,
    emotion: null,
  }));

  const weeklyTrends = computeWeeklyTrends(reflections, timeZone);

  return NextResponse.json({
    reflections,
    weeklyTrends,
  });
}
