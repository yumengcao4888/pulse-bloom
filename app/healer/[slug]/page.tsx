import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { classifyEmotion, classifyFeeling } from "@/lib/huggingface";
import { prisma } from "@/lib/prisma";
import {
  computeScores,
  getMonthlyReflections,
  computeWeeklySentiment,
  computeWeeklyTrends,
  capitalize,
} from "@/lib/utils";
import { TrendChart } from "@/components/healer/trend-chart";
import MyWordcloud from "@/components/healer/simple-wordcloud";
import type { Word } from "react-wordcloud";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

type PageProps = {
  params: Promise<{ slug: string }>;
};

const formatBool = (value: boolean | null | undefined) =>
  value == null ? "N/A" : value ? "Yes" : "No";

const formatDate = (date: string | Date) => new Date(date).toLocaleString();

const formatPercent = (value: number | null | undefined) => (value == null ? "—" : `${value}%`);

const formatDelta = (current: number | null | undefined, baseline: number | null | undefined) => {
  if (current == null || baseline == null) return "N/A";
  const delta = current - baseline;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(0)}%`;
};

type HeatmapCategoryKey = "grounded" | "supported" | "connected" | "sentiment";

const heatmapCategories: { key: HeatmapCategoryKey; label: string }[] = [
  { key: "grounded", label: "Grounded" },
  { key: "supported", label: "Supported" },
  { key: "connected", label: "Connected" },
  { key: "sentiment", label: "Sentiment" },
];

const formatWeekLabel = (week: string) => {
  const date = new Date(week);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const getHeatStyle = (value: number | null | undefined) => {
  if (value == null) {
    return {
      backgroundColor: "#f8fafc",
      color: "#475569",
    };
  }

  const normalized = Math.max(0, Math.min(1, value / 100));
  const hue = 220 - normalized * 160;
  const lightness = 65 - normalized * 35;
  const textColor = lightness < 50 ? "#ffffff" : "#0f172a";

  return {
    backgroundColor: `hsl(${hue}, 75%, ${lightness}%)`,
    color: textColor,
  };
};

type MetricComparison = {
  label: string;
  monthly: string;
  allTime: string;
};

export default async function HealerPage(props: PageProps) {
  const { slug } = await props.params;

  const healer = await prisma.healer.findUnique({
    where: { slug },
    include: {
      reflections: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!healer) {
    return <div className="relative z-10 p-6 text-red-500">Healer not found.</div>;
  }

  const reflectionLink = `http://localhost:3000/reflection/${slug}`;
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
  const monthlySentiment = (() => {
    const recent = getMonthlyReflections(reflectionsWithAnalysis);
    const sentimentScores = recent
      .map((reflection) => reflection.sentiment?.score)
      .filter((score): score is number => score != null);
    if (sentimentScores.length === 0) return null;
    const avg = sentimentScores.reduce((total, value) => total + value, 0) / sentimentScores.length;
    return Math.round(avg * 100);
  })();

  const sentimentCounts = reflectionsWithAnalysis.reduce<Record<string, number>>(
    (acc, reflection) => {
      const label = reflection.sentiment?.label ?? "Unclassified";
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const summaryEntries = Object.entries(sentimentCounts);

  const weeklyTrendMap = Object.fromEntries(
    weeklyTrends.map((trend) => [trend.date, trend]),
  ) as Record<string, typeof weeklyTrends[number]>;
  const heatmapWeeks = weeklyTrends.map((trend) => trend.date);
  const heatmapRows = heatmapCategories.map((category) => ({
    label: category.label,
    values: heatmapWeeks.map((week) => {
      if (category.key === "sentiment") {
        return weeklySentiment[week] ?? null;
      }

      return weeklyTrendMap[week]?.[category.key] ?? null;
    }),
  }));
  const hasHeatmapData = heatmapWeeks.length > 0;

  const metricComparisons: MetricComparison[] = [
    {
      label: "Community Grounding Score",
      monthly: formatPercent(scores.monthly.grounded),
      allTime: formatPercent(scores.allTime.grounded),
    },
    {
      label: "Support & Care Score",
      monthly: formatPercent(scores.monthly.supported),
      allTime: formatPercent(scores.allTime.supported),
    },
    {
      label: "Connection Index",
      monthly: formatPercent(scores.monthly.connected),
      allTime: formatPercent(scores.allTime.connected),
    },
  ];

  const metricToWord = (text: string, value: number | null): Word => ({
    text,
    value: (value ?? 0),
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
  const wordcloudWords: Word[] = [
    metricToWord("grounded", scores.allTime.grounded),
    metricToWord("supported", scores.allTime.supported),
    metricToWord("connected", scores.allTime.connected),
    ...emotionWords,
  ];
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

  return (
    <>
      <div className="relative z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="my-10 mx-auto max-w-xl flex flex-col items-center space-y-6">
          <Image
          src="/default-healer.jpg"
          alt="Healer profile photo"
          width={200}
          height={200}
          className="rounded-full object-cover"
        />
        <h1 className="mb-5 flex items-baseline gap-2 text-3xl font-semibold">
          <span>{healer.name}</span>
          {healer.pronouns && (
            <span className="text-xl font-normal text-gray-600">
              ({healer.pronouns})
            </span>
          )}
        </h1>
          <div className="w-full rounded-2xl border bg-white/70 p-6 shadow-sm">
            <p className="text-gray-700">
              <b>My approach:</b> {healer.modality}
            </p>
            <p className="text-gray-700">
              <b>I work with:</b> {healer.focus}
            </p>
            <p className="text-gray-700">
              <b>Location:</b> {healer.city}
            </p>
            <p className="text-gray-700">
              <b>Contact:</b> {healer.contact}
            </p>
            <p className="text-gray-700">
              <b>About me:</b> {healer.bio}
            </p>
          </div>
          <div className="w-full rounded-2xl border bg-white/70 p-6 shadow-sm space-y-3">
            <h2 className="text-2xl font-semibold">What we felt this month</h2>
            <div className="space-y-2 text-gray-700">
              <p><b>🌱 Feeling grounded</b></p>
              <p><b>{formatPercent(scores.monthly.grounded)}</b> of the time, our community felt rooted and present.</p>
              <p><b>💛 Feeling supported</b></p>
              <p><b>{formatPercent(scores.monthly.supported)}</b> of all reflections spoke of being held with care.</p>
              <p><b>🤝 Feeling connected</b></p>
              <p><b>{formatPercent(scores.monthly.connected)}</b> of reflections expressed warmth and togetherness.</p>
              <p><b>🌤️ Overall mood</b></p>
              <p>Our community’s emotional tone this month: <b>{monthlySentiment} / 100</b>.</p>
              <p><b>🗣️ Top words</b></p>
              <p>
                The voices in this space often whispered:{" "}
                {topWords.length > 0
                  ? topWords.map((word, index) => (
                      <span key={`${word}-${index}`}>
                        <b>
                          <i>{word}</i>
                        </b>
                        {index < topWords.length - 1 ? ", " : ""}
                      </span>
                    ))
                  : "—"}
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
