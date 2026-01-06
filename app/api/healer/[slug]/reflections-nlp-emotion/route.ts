import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyEmotion } from "@/lib/huggingface";

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

  const hfEnabled = Boolean(process.env.HF_TOKEN);
  if (!hfEnabled || reflections.length === 0) {
    return NextResponse.json({ reflections: [] });
  }

  const reflectionsWithEmotion = await Promise.all(
    reflections.map(async (reflection) => ({
      ...reflection,
      sentiment: null,
      emotion: await classifyEmotion(reflection.feeling),
    })),
  );

  const targetLabel = emotion.toLowerCase();
  const matched = reflectionsWithEmotion.filter(
    (reflection) => reflection.emotion?.label?.toLowerCase() === targetLabel,
  );

  return NextResponse.json({ reflections: matched });
}
