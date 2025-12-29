"use client";

import { useCallback, useMemo, useState } from "react";
import type { Word } from "react-wordcloud";
import { TrendChart } from "@/components/healer/trend-chart";
import MyWordcloud from "@/components/healer/simple-wordcloud";
import PrintProfileButton from "@/components/healer/print-profile-button";
import { useLocale } from "@/components/shared/locale-provider";
import { capitalize, fetcher } from "@/lib/utils";
import type { ScoreSummary, TrendPoint } from "@/lib/utils";
import type { EmotionPrediction, SentimentPrediction } from "@/lib/huggingface";

type ReflectionEntry = {
  id: string;
  grounded: boolean | null;
  supported: boolean | null;
  connected: boolean | null;
  feeling: string | null;
  createdAt: string;
  sentiment: SentimentPrediction | null;
  emotion: EmotionPrediction | null;
};

type ReflectionsPayload = {
  hfEnabled: boolean;
  reflections: ReflectionEntry[];
  summaryEntries: { label: string; count: number }[];
  scores: {
    allTime: ScoreSummary;
    monthly: ScoreSummary;
  };
  weeklyTrends: TrendPoint[];
  weeklySentiment: Record<string, number | null>;
  wordcloudWords: Word[];
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

function ReflectionsSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-4 w-48 rounded bg-gray-200" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-16 rounded-xl bg-gray-100" />
        <div className="h-16 rounded-xl bg-gray-100" />
        <div className="h-16 rounded-xl bg-gray-100" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-xl bg-gray-100" />
        <div className="h-28 rounded-xl bg-gray-100" />
        <div className="h-28 rounded-xl bg-gray-100" />
      </div>
      <div className="h-64 rounded-2xl bg-gray-100" />
      <div className="h-44 rounded-2xl bg-gray-100" />
      <div className="h-52 rounded-2xl bg-gray-100" />
    </div>
  );
}

function formatPercent(value: number | null | undefined, fallback: string) {
  return value == null ? fallback : `${value}%`;
}

type ReflectionsDisclosureProps = {
  slug: string;
  reflectionsCount: number;
};

export default function ReflectionsDisclosure({
  slug,
  reflectionsCount,
}: ReflectionsDisclosureProps) {
  const { t, locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ReflectionsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReflections = useCallback(async () => {
    if (isLoading || data) return;
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetcher<ReflectionsPayload>(
        `/api/healer/${slug}/reflections`,
      );
      setData(payload);
    } catch (err) {
      console.error("Failed to load reflections", err);
      setError(t("reflection.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [data, isLoading, slug, t]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && !data && !isLoading) {
        void loadReflections();
      }
      return next;
    });
  };

  const formatDate = (date: string) => new Date(date).toLocaleString(locale);
  const formatBool = (value: boolean | null | undefined) =>
    value == null ? t("common.na") : value ? t("common.yes") : t("common.no");

  const hasData = Boolean(data);

  const metricComparisons = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: t("healer.metric.grounded"),
        monthly: formatPercent(data.scores.monthly.grounded, t("common.none")),
        allTime: formatPercent(data.scores.allTime.grounded, t("common.none")),
      },
      {
        label: t("healer.metric.supported"),
        monthly: formatPercent(data.scores.monthly.supported, t("common.none")),
        allTime: formatPercent(data.scores.allTime.supported, t("common.none")),
      },
      {
        label: t("healer.metric.connected"),
        monthly: formatPercent(data.scores.monthly.connected, t("common.none")),
        allTime: formatPercent(data.scores.allTime.connected, t("common.none")),
      },
    ];
  }, [data, t]);

  const heatmap = useMemo(() => {
    if (!data) {
      return {
        heatmapWeeks: [],
        heatmapRows: [],
        hasHeatmapData: false,
      };
    }
    const weeklyTrendMap = Object.fromEntries(
      data.weeklyTrends.map((trend) => [trend.date, trend]),
    ) as Record<string, TrendPoint>;
    const heatmapWeeks = data.weeklyTrends.map((trend) => trend.date);
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
          return data.weeklySentiment[week] ?? null;
        }
        return weeklyTrendMap[week]?.[category] ?? null;
      }),
    }));

    return {
      heatmapWeeks,
      heatmapRows,
      hasHeatmapData: heatmapWeeks.length > 0,
    };
  }, [data, t]);

  const formatWeekLabel = (week: string) => {
    const date = new Date(week);
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  return (
    <div className="relative z-10 w-full max-w-2xl px-5 xl:px-0 space-y-6">
      <div className="rounded-2xl border bg-white/70 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{t("healer.reflections.title")}</h2>
            <p className="text-sm text-gray-500">{t("healer.reflections.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            {isOpen ? t("healer.reflections.hide") : t("healer.reflections.view")}
          </button>
        </div>

        {isOpen && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-gray-700">
              <p>
                <b>{t("healer.dev.reflectionsCount")}:</b> {reflectionsCount}
              </p>
              <PrintProfileButton slug={slug} />
            </div>
            {!hasData && isLoading && <ReflectionsSkeleton />}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={loadReflections}
                  className="mt-3 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
                >
                  {t("healer.reflections.retry")}
                </button>
              </div>
            )}
            {data && (
              <>
                <p className="text-sm text-gray-500">
                  {data.hfEnabled
                    ? t("reflection.hf.enabled")
                    : t("reflection.hf.disabled")}
                </p>

                {data.summaryEntries.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {data.summaryEntries.map(({ label, count }) => {
                      const displayLabel =
                        label === "Unclassified" ? t("common.unclassified") : label;
                      return (
                        <div
                          key={`${label}-${count}`}
                          className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-center text-sm shadow-sm"
                        >
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            {displayLabel}
                          </p>
                          <p className="text-lg font-semibold text-gray-800">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  {metricComparisons.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        {metric.label}
                      </p>
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            {t("healer.metric.monthly")}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-800">
                            {metric.monthly}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            {t("healer.metric.allTime")}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-800">
                            {metric.allTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {data.weeklyTrends.length > 0 ? (
                  <div className="mt-6">
                    <TrendChart data={data.weeklyTrends} />
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-gray-500">
                    {t("reflection.addPrompt")}
                  </p>
                )}

                {heatmap.hasHeatmapData ? (
                  <div className="mt-6 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
                    <h3 className="mb-3 text-lg font-semibold text-gray-800">
                      {t("healer.heatmap.title")}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-fixed text-sm">
                        <thead>
                          <tr>
                            <th className="border-b px-3 py-2 text-left text-xs uppercase tracking-wide text-gray-500">
                              {t("healer.heatmap.metricWeek")}
                            </th>
                            {heatmap.heatmapWeeks.map((week) => (
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
                          {heatmap.heatmapRows.map((row) => (
                            <tr key={row.label}>
                              <td className="border-b px-3 py-2 font-medium text-gray-700">
                                {row.label}
                              </td>
                              {row.values.map((value, index) => (
                                <td
                                  key={`${row.label}-${heatmap.heatmapWeeks[index]}`}
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
                  <MyWordcloud words={data.wordcloudWords} />
                </div>

                <div className="space-y-4">
                  {data.reflections.length === 0 ? (
                    <p className="text-sm text-gray-500">{t("reflection.none")}</p>
                  ) : (
                    data.reflections.map((reflection) => (
                      <div
                        key={reflection.id}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <div className="mb-2 flex flex-wrap gap-4 text-sm text-gray-700">
                          <span>
                            <b>{t("reflection.grounded")}:</b>{" "}
                            {formatBool(reflection.grounded)}
                          </span>
                          <span>
                            <b>{t("reflection.supported")}:</b>{" "}
                            {formatBool(reflection.supported)}
                          </span>
                          <span>
                            <b>{t("reflection.connected")}:</b>{" "}
                            {formatBool(reflection.connected)}
                          </span>
                        </div>
                        <p className="text-base text-gray-800 mb-2">
                          <b>{t("reflection.feeling")}:</b>{" "}
                          {reflection.feeling ?? t("common.na")}
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
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
