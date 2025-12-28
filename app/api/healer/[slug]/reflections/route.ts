import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyEmotion, classifyFeeling } from "@/lib/huggingface";
import {
  computeScores,
  computeWeeklySentiment,
  computeWeeklyTrends,
} from "@/lib/utils";
import type { Word } from "react-wordcloud";

export const dynamic = "force-dynamic";

const metricToWord = (text: string, value: number | null): Word => ({
  text,
  value: value ?? 0,
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
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

  const hfEnabled = Boolean(process.env.HF_TOKEN);
  const reflectionsWithAnalysis = await Promise.all(
    healer.reflections.map(async (reflection) => ({
      ...reflection,
      sentiment: hfEnabled ? await classifyFeeling(reflection.feeling) : null,
      emotion: hfEnabled ? await classifyEmotion(reflection.feeling) : null,
    })),
  );

  const scores = computeScores(reflectionsWithAnalysis);
  const weeklyTrends = computeWeeklyTrends(reflectionsWithAnalysis);
  const weeklySentiment = computeWeeklySentiment(reflectionsWithAnalysis);

  const sentimentCounts = reflectionsWithAnalysis.reduce<Record<string, number>>(
    (acc, reflection) => {
      const label = reflection.sentiment?.label ?? "Unclassified";
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const summaryEntries = Object.entries(sentimentCounts).map(([label, count]) => ({
    label,
    count,
  }));

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
  const emotionWords: Word[] = Object.entries(emotionCounts).map(
    ([label, count]) => {
      const percentage =
        totalEmotionCount === 0 ? 0 : (count / totalEmotionCount) * 100;
      return metricToWord(label, Math.round(percentage));
    },
  );
  const wordcloudWords: Word[] = [
    metricToWord("grounded", scores.allTime.grounded),
    metricToWord("supported", scores.allTime.supported),
    metricToWord("connected", scores.allTime.connected),
    ...emotionWords,
  ];

  return NextResponse.json({
    hfEnabled,
    reflections: reflectionsWithAnalysis,
    summaryEntries,
    scores,
    weeklyTrends,
    weeklySentiment,
    wordcloudWords,
  });
}
