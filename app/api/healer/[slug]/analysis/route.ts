import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeScores, getMonthlyReflections, roundToTwo } from "@/lib/utils";

type Word = {
  text: string;
  value: number;
};

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
        },
      },
    },
  });

  if (!healer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const scores = computeScores(healer.reflections);
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

  const metricToWord = (text: string, value: number | null): Word => ({
    text,
    value: value ?? 0,
  });

  const topWords = [
    metricToWord("grounded", scores.allTime.grounded),
    metricToWord("supported", scores.allTime.supported),
    metricToWord("connected", scores.allTime.connected),
  ]
    .filter((word) => word.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((word) => word.text);

  return NextResponse.json({
    monthlySentiment,
    allTimeSentiment,
    topWords,
  });
}
