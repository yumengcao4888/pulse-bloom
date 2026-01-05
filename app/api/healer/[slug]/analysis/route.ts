import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyEmotion, classifyFeeling } from "@/lib/huggingface";
import { computeScores, getMonthlyReflections } from "@/lib/utils";

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
        },
      },
    },
  });

  if (!healer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hfEnabled = Boolean(process.env.HF_TOKEN);
  const reflectionsWithAnalysis = await Promise.all(
    healer.reflections.map(async (reflection) => ({
      ...reflection,
      sentiment: hfEnabled ? await classifyFeeling(reflection.feeling) : null,
      emotion: hfEnabled ? await classifyEmotion(reflection.feeling) : null,
    })),
  );

  const scores = computeScores(reflectionsWithAnalysis);
  const monthlyReflections = getMonthlyReflections(reflectionsWithAnalysis);
  const monthlySentiment = (() => {
    const sentimentScores = monthlyReflections
      .map((reflection) => reflection.sentiment?.score)
      .filter((score): score is number => score != null);
    if (sentimentScores.length === 0) return null;
    const avg = sentimentScores.reduce((total, value) => total + value, 0) / sentimentScores.length;
    return Math.round(avg * 100);
  })();
  const allTimeSentiment = (() => {
    const sentimentScores = reflectionsWithAnalysis
      .map((reflection) => reflection.sentiment?.score)
      .filter((score): score is number => score != null);
    if (sentimentScores.length === 0) return null;
    const avg = sentimentScores.reduce((total, value) => total + value, 0) / sentimentScores.length;
    return Math.round(avg * 100);
  })();

  const metricToWord = (text: string, value: number | null): Word => ({
    text,
    value: value ?? 0,
  });

  const emotionCounts = reflectionsWithAnalysis.reduce<Record<string, number>>(
    (acc, reflection) => {
      const label = reflection.emotion?.label;
      if (!label) return acc;
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const totalEmotionCount = Object.values(emotionCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const emotionWords: Word[] = Object.entries(emotionCounts).map(([label, count]) => {
    const percentage = totalEmotionCount === 0 ? 0 : (count / totalEmotionCount) * 100;
    return metricToWord(label, Math.round(percentage));
  });
  const topWords = [
    metricToWord("grounded", scores.allTime.grounded),
    metricToWord("supported", scores.allTime.supported),
    metricToWord("connected", scores.allTime.connected),
    ...emotionWords,
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
