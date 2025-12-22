import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { classifyEmotion, classifyFeeling } from "@/lib/huggingface";
import { prisma } from "@/lib/prisma";
import {
  computeScores,
  computeWeeklySentiment,
  computeWeeklyTrends,
  capitalize,
} from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";
import { TrendChart } from "@/components/healer/trend-chart";
import MyWordcloud from "@/components/healer/simple-wordcloud";
import PrintProfileButton from "@/components/healer/print-profile-button";
import type { Word } from "react-wordcloud";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

type PageProps = {
  params: Promise<{ slug: string }>;
};

type HeatmapCategoryKey = "grounded" | "supported" | "connected" | "sentiment";

const heatmapCategories: HeatmapCategoryKey[] = [
  "grounded",
  "supported",
  "connected",
  "sentiment",
];

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

export default async function HealingSpacePage(props: PageProps) {
  const { slug } = await props.params;
  const locale = await getLocale();
  const t = getTranslations(locale);
  const formatDate = (date: string | Date) => new Date(date).toLocaleString(locale);
  const formatBool = (value: boolean | null | undefined) =>
    value == null ? t("common.na") : value ? t("common.yes") : t("common.no");
  const formatPercent = (value: number | null | undefined) =>
    value == null ? t("common.none") : `${value}%`;
  const formatWeekLabel = (week: string) => {
    const date = new Date(week);
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  const healer = await prisma.healer.findUnique({
    where: { slug },
    include: {
      reflections: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!healer) {
    return <div className="relative z-10 p-6 text-red-500">{t("healer.notFound")}</div>;
  }

  const reflectionLink = `http://pulse-bloom.vercel.app/reflection/${slug}`;
  const sharableLink = `http://pulse-bloom.vercel.app/healer/${slug}`;
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
      const label = reflection.sentiment?.label ?? t("common.unclassified");
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const summaryEntries = Object.entries(sentimentCounts);

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
  const wordcloudWords: Word[] = [
    metricToWord("grounded", scores.allTime.grounded),
    metricToWord("supported", scores.allTime.supported),
    metricToWord("connected", scores.allTime.connected),
    ...emotionWords,
  ];

  const weeklyTrendMap = Object.fromEntries(
    weeklyTrends.map((trend) => [trend.date, trend]),
  ) as Record<string, typeof weeklyTrends[number]>;
  const heatmapWeeks = weeklyTrends.map((trend) => trend.date);
  const heatmapRows = heatmapCategories.map((category) => ({
    label:
      category === "sentiment"
        ? t("reflection.sentiment")
        : category === "grounded"
        ? t("reflection.grounded")
        : category === "supported"
        ? t("reflection.supported")
        : t("reflection.connected"),
    values: heatmapWeeks.map((week) => {
      if (category === "sentiment") {
        return weeklySentiment[week] ?? null;
      }

      return weeklyTrendMap[week]?.[category] ?? null;
    }),
  }));
  const hasHeatmapData = heatmapWeeks.length > 0;

  const metricComparisons: MetricComparison[] = [
    {
      label: t("healer.metric.grounded"),
      monthly: formatPercent(scores.monthly.grounded),
      allTime: formatPercent(scores.allTime.grounded),
    },
    {
      label: t("healer.metric.supported"),
      monthly: formatPercent(scores.monthly.supported),
      allTime: formatPercent(scores.allTime.supported),
    },
    {
      label: t("healer.metric.connected"),
      monthly: formatPercent(scores.monthly.connected),
      allTime: formatPercent(scores.allTime.connected),
    },
  ];

  return (
    <>
      <div className="relative z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="my-10 mx-auto max-w-xl">
          <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
            <div className="mb-3 flex justify-center">
              <QRCodeSVG value={reflectionLink} size={120} />
            </div>
            <h1 className="text-3xl font-semibold mb-5">{healer.name}</h1>
            <p className="text-gray-700">
              <b>{t("healer.dev.pronouns")}:</b> {healer.pronouns}
            </p>
            <p className="text-gray-700">
              <b>{t("healer.dev.modality")}:</b> {healer.modality}
            </p>
            <p className="text-gray-700">
              <b>{t("healer.dev.focus")}:</b> {healer.focus}
            </p>
            <p className="text-gray-700">
              <b>{t("healer.dev.city")}:</b> {healer.city}
            </p>
            <p className="text-gray-700">
              <b>{t("healer.dev.contact")}:</b> {healer.contact}
            </p>
            <p className="text-gray-700">
              <b>{t("healer.dev.bio")}:</b> {healer.bio}
            </p>
            <p className="text-gray-700">
              <b>{t("healer.dev.reflectionLink")}:</b>{" "}
              <Link href={reflectionLink} className="text-blue-600 underline">
                {reflectionLink}
              </Link>
            </p>
            <p className="text-gray-700">
              <b>Sharable link:</b>{" "}
              <Link href={sharableLink} className="text-blue-600 underline">
                {sharableLink}
              </Link>
            </p>
            <div className="flex flex-wrap items-center gap-3 text-gray-700">
              <p>
                <b>{t("healer.dev.reflectionsCount")}:</b> {reflectionsWithAnalysis.length}
              </p>
              <PrintProfileButton slug={healer.slug} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-xl px-5 xl:px-0 space-y-6">
        <div className="rounded-2xl border bg-white/70 p-6 shadow-sm space-y-4">
          <h2 className="text-2xl font-semibold">{t("healer.reflections.title")}</h2>
          <p className="text-sm text-gray-500">
            {hfEnabled
              ? t("reflection.hf.enabled")
              : t("reflection.hf.disabled")}
          </p>
          {summaryEntries.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {summaryEntries.map(([label, count]) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-center text-sm shadow-sm"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="text-lg font-semibold text-gray-800">{count}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {metricComparisons.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-gray-700 mb-3">{metric.label}</p>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{t("healer.metric.monthly")}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-800">{metric.monthly}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{t("healer.metric.allTime")}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-800">{metric.allTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {weeklyTrends.length > 0 ? (
            <div className="mt-6">
              <TrendChart data={weeklyTrends} />
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-500">
              {t("reflection.addPrompt")}
            </p>
          )}

          {hasHeatmapData ? (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">{t("healer.heatmap.title")}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed text-sm">
                  <thead>
                    <tr>
                      <th className="border-b px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-500">
                        {t("healer.heatmap.metricWeek")}
                      </th>
                      {heatmapWeeks.map((week) => (
                        <th
                          key={week}
                          className="border-b px-3 py-2 text-center text-xs uppercase tracking-wide text-gray-500"
                        >
                          {formatWeekLabel(week)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapRows.map((row) => (
                      <tr key={row.label}>
                        <td className="border-b px-3 py-2 font-medium text-gray-700">{row.label}</td>
                        {row.values.map((value, index) => (
                          <td
                            key={`${row.label}-${heatmapWeeks[index]}`}
                            className="border-b px-2 py-1"
                          >
                            <div
                              className="flex h-12 items-center justify-center rounded text-xs font-semibold uppercase tracking-wide"
                              style={getHeatStyle(value)}
                            >
                              {value == null ? t("common.none") : `${value}%`}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {t("healer.heatmap.caption")}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-500">
              {t("reflection.addHeatmap")}
            </p>
          )}

          <div className="w-full max-w-md mx-auto rounded-2xl border bg-white/70 p-5 shadow-sm">
            <MyWordcloud words={wordcloudWords} />
          </div>

          {reflectionsWithAnalysis.length === 0 ? (
            <p className="text-gray-600">{t("reflection.none")}</p>
          ) : (
            <div className="space-y-4">
              {reflectionsWithAnalysis.map((reflection) => (
                <div key={reflection.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-2 flex flex-wrap gap-4 text-sm text-gray-700">
                    <span>
                      <b>{t("reflection.grounded")}:</b> {formatBool(reflection.grounded)}
                    </span>
                    <span>
                      <b>{t("reflection.supported")}:</b> {formatBool(reflection.supported)}
                    </span>
                    <span>
                      <b>{t("reflection.connected")}:</b> {formatBool(reflection.connected)}
                    </span>
                  </div>
                  <p className="text-base text-gray-800 mb-2">
                    <b>{t("reflection.feeling")}:</b> {reflection.feeling ?? t("common.na")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("reflection.sentiment")}:{" "}
                    {reflection.sentiment
                      ? `${reflection.sentiment.label} (Score: ${(
                          reflection.sentiment.score * 100
                        ).toFixed(0)})`
                      : t("common.unavailable")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("reflection.emotion")}:{" "}
                    {reflection.emotion?.label
                      ? capitalize(reflection.emotion.label)
                      : t("common.unavailable")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("reflection.created")}: {formatDate(reflection.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
