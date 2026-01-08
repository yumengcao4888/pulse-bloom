import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMonthlyReflections, getTopEmotionWords, roundToTwo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const healer = await prisma.healer.findUnique({
    where: { slug },
    include: {
      reflections: {
        orderBy: { createdAt: "desc" },
        select: {
          feeling: true,
          grounded: true,
          supported: true,
          connected: true,
          createdAt: true,
          emotionalWarmth: true,
          emotionalTone: true,
        },
      },
    },
  });

  if (!healer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const monthlyReflections = getMonthlyReflections(healer.reflections);
  const monthlySentiment = (() => {
    const warmthScores = monthlyReflections
      .map((reflection) =>
        reflection.emotionalWarmth == null
          ? null
          : Number(reflection.emotionalWarmth),
      )
      .filter((score): score is number => Number.isFinite(score));
    if (warmthScores.length === 0) return null;
    const avg = warmthScores.reduce((total, value) => total + value, 0) / warmthScores.length;
    return roundToTwo(avg);
  })();
  const allTimeSentiment = (() => {
    const warmthScores = healer.reflections
      .map((reflection) =>
        reflection.emotionalWarmth == null
          ? null
          : Number(reflection.emotionalWarmth),
      )
      .filter((score): score is number => Number.isFinite(score));
    if (warmthScores.length === 0) return null;
    const avg = warmthScores.reduce((total, value) => total + value, 0) / warmthScores.length;
    return roundToTwo(avg);
  })();

  const topWords = getTopEmotionWords(healer.reflections);

  return NextResponse.json({
    monthlySentiment,
    allTimeSentiment,
    topWords,
  });
}
