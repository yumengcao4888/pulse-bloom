import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyEmotion, classifyFeeling } from "@/lib/huggingface";

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
  const range = url.searchParams.get("range");
  if (range && range !== "monthly" && range !== "allTime") {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const healer = await prisma.healer.findUnique({
    where: { slug },
    include: {
      reflections: {
        orderBy: { createdAt: "desc" },
        select: {
          feeling: true,
          createdAt: true,
        },
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
    return NextResponse.json({
      hfEnabled,
      sentimentScore: null,
      topEmotions: [],
    });
  }

  const reflectionsWithAnalysis = await Promise.all(
    reflections.map(async (reflection) => ({
      sentiment: await classifyFeeling(reflection.feeling),
      emotion: await classifyEmotion(reflection.feeling),
    })),
  );

  const sentimentScores = reflectionsWithAnalysis
    .map((reflection) => reflection.sentiment?.score)
    .filter((score): score is number => score != null);
  const sentimentScore =
    sentimentScores.length === 0
      ? null
      : Math.round(
          (sentimentScores.reduce((total, value) => total + value, 0) /
            sentimentScores.length) *
            100,
        );

  const emotionCounts = reflectionsWithAnalysis.reduce<Record<string, number>>(
    (acc, reflection) => {
      const label = reflection.emotion?.label;
      if (!label) return acc;
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const emotionPriority = [
    "gratitude",
    "love",
    "admiration",
    "joy",
    "caring",
    "approval",
    "optimism",
    "pride",
    "relief",
    "excitement",
    "amusement",
    "desire",
    "curiosity",
    "surprise",
    "realization",
    "confusion",
    "neutral",
    "sadness",
    "nervousness",
    "fear",
    "disappointment",
    "remorse",
    "embarrassment",
    "grief",
    "annoyance",
    "disapproval",
    "anger",
    "disgust",
  ];
  const priorityIndex = new Map(
    emotionPriority.map((label, index) => [label, index]),
  );

  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => {
      const countDiff = b[1] - a[1];
      if (countDiff !== 0) return countDiff;
      const aIndex = priorityIndex.get(a[0].toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = priorityIndex.get(b[0].toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    })
    .slice(0, 2)
    .map(([label, count]) => ({ label, count }));

  return NextResponse.json({
    hfEnabled,
    sentimentScore,
    topEmotions,
  });
}
