import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MONTHLY_WINDOW_DAYS = 30;

function getMonthlyThreshold() {
  const referenceDate = new Date();
  const threshold = new Date(referenceDate);
  threshold.setDate(referenceDate.getDate() - MONTHLY_WINDOW_DAYS);
  return threshold;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const url = new URL(request.url);
  const emotion = url.searchParams.get("emotion");
  const range = url.searchParams.get("range");
  if (!emotion) {
    return NextResponse.json({ error: "Missing emotion" }, { status: 400 });
  }
  if (range && range !== "monthly" && range !== "allTime") {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
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

  const threshold = getMonthlyThreshold();
  const reflections =
    range === "monthly"
      ? healer.reflections.filter(
          (reflection) => new Date(reflection.createdAt) >= threshold,
        )
      : healer.reflections;

  if (reflections.length === 0) {
    return NextResponse.json({ reflections: [] });
  }

  const targetLabel = emotion.toLowerCase();
  const matched = reflections
    .filter(
      (reflection) =>
        reflection.emotionalTone?.toLowerCase() === targetLabel &&
        reflection.heardAt == null,
    )
    .map((reflection) => ({
      ...reflection,
      sentiment: null,
      emotion: reflection.emotionalTone
        ? { label: reflection.emotionalTone, score: 1 }
        : null,
    }));

  return NextResponse.json({ reflections: matched });
}
