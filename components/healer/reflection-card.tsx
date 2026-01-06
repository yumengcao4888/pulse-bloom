"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendChart } from "@/components/healer/trend-chart";
import { useLocale } from "@/components/shared/locale-provider";
import Tooltip from "@/components/shared/tooltip";
import { capitalize, fetcher, getMonthlyReflections } from "@/lib/utils";
import type { TrendPoint } from "@/lib/utils";
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
  reflections: ReflectionEntry[];
};

type TrendsPayload = {
  trends: TrendPoint[];
};

type SentimentSummary = {
  hfEnabled: boolean;
  sentimentScore: number | null;
  topEmotions: { label: string; count: number }[];
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

type ReflectionCardProps = {
  slug: string;
  reflectionsCount: number;
  allTimeCounts: {
    total: number;
    grounded: number;
    supported: number;
    connected: number;
    comments: number;
  };
  monthlyCounts: {
    total: number;
    grounded: number;
    supported: number;
    connected: number;
    comments: number;
  };
};

type SectionKey = "trends" | "printout";

export default function ReflectionCard({
  slug,
  reflectionsCount,
  allTimeCounts,
  monthlyCounts,
}: ReflectionCardProps) {
  const { t, locale } = useLocale();
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [data, setData] = useState<ReflectionsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<{
    monthly?: TrendPoint[];
    allTime?: TrendPoint[];
  }>({});
  const [hasNlpInsights, setHasNlpInsights] = useState(false);
  const [isNlpLoading, setIsNlpLoading] = useState(false);
  const [nlpError, setNlpError] = useState<string | null>(null);
  const [printoutSort, setPrintoutSort] = useState<"desc" | "asc">("desc");
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [printoutPage, setPrintoutPage] = useState(1);
  const [countRange, setCountRange] = useState<"monthly" | "allTime">("allTime");
  const [showSentiment, setShowSentiment] = useState(false);
  const [sentimentSummary, setSentimentSummary] = useState<{
    monthly?: SentimentSummary;
    allTime?: SentimentSummary;
  }>({});
  const [isSentimentLoading, setIsSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  const pageSize = 10;

  const loadReflections = useCallback(async () => {
    if (isLoading || data) return;
    setIsLoading(true);
    setError(null);
    setHasNlpInsights(false);
    setNlpError(null);
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

  const loadNlpInsights = useCallback(async () => {
    if (isNlpLoading || hasNlpInsights || !data) return;
    setIsNlpLoading(true);
    setNlpError(null);
    try {
      const payload = await fetcher<ReflectionsPayload>(
        `/api/healer/${slug}/reflections-nlp`,
      );
      const reflectionMap = new Map(
        payload.reflections.map((reflection) => [reflection.id, reflection]),
      );
      setData((prev) => {
        if (!prev) return prev;
        return {
          reflections: prev.reflections.map((reflection) => {
            const match = reflectionMap.get(reflection.id);
            if (!match) return reflection;
            return {
              ...reflection,
              sentiment: match.sentiment,
              emotion: match.emotion,
            };
          }),
        };
      });
      setHasNlpInsights(true);
    } catch (err) {
      console.error("Failed to load NLP insights", err);
      setNlpError(t("reflection.loadError"));
    } finally {
      setIsNlpLoading(false);
    }
  }, [data, hasNlpInsights, isNlpLoading, slug, t]);

  const loadTrends = useCallback(
    async (range: "monthly" | "allTime") => {
      if (isTrendLoading || trendData[range]) return;
      setIsTrendLoading(true);
      setTrendError(null);
      try {
        const payload = await fetcher<TrendsPayload>(
          `/api/healer/${slug}/trends?range=${range}`,
        );
        setTrendData((prev) => ({ ...prev, [range]: payload.trends }));
      } catch (err) {
        console.error("Failed to load trends", err);
        setTrendError(t("reflection.loadError"));
      } finally {
        setIsTrendLoading(false);
      }
    },
    [isTrendLoading, slug, t, trendData],
  );

  const loadSentimentSummary = useCallback(
    async (range: "monthly" | "allTime") => {
      setIsSentimentLoading(true);
      setSentimentError(null);
      try {
        const payload = await fetcher<SentimentSummary>(
          `/api/healer/${slug}/sentiment-summary?range=${range}`,
        );
        setSentimentSummary((prev) => ({ ...prev, [range]: payload }));
      } catch (err) {
        console.error("Failed to load sentiment summary", err);
        setSentimentError(t("reflection.loadError"));
      } finally {
        setIsSentimentLoading(false);
      }
    },
    [slug, t],
  );

  const ensureDataLoaded = () => {
    if (!data && !isLoading) {
      void loadReflections();
    }
  };

  const ensureTrendsLoaded = (range: "monthly" | "allTime") => {
    if (!trendData[range] && !isTrendLoading) {
      void loadTrends(range);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString(locale);
  const formatBool = (value: boolean | null | undefined) =>
    value == null ? t("common.na") : value ? t("common.yes") : t("common.no");

  const hasData = Boolean(data);
  const showTrends = activeSection === "trends";
  const showPrintout = activeSection === "printout";
  const handleSectionToggle = (section: SectionKey) => {
    setActiveSection((prev) => {
      const next = prev === section ? null : section;
      if (next === "printout") ensureDataLoaded();
      if (next === "trends") ensureTrendsLoaded(countRange);
      return next;
    });
    setShowSentiment(false);
  };

  const handleSentimentToggle = () => {
    setShowSentiment((prev) => {
      const next = !prev;
      if (next) {
        setActiveSection(null);
      }
      return next;
    });
  };

  const filteredPrintout = useMemo(() => {
    if (!data) return [];
    if (countRange === "allTime") return data.reflections;
    return getMonthlyReflections(data.reflections);
  }, [countRange, data]);

  const sortedPrintout = useMemo(() => {
    const items = [...filteredPrintout];
    items.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return printoutSort === "asc" ? aTime - bTime : bTime - aTime;
    });
    return items;
  }, [filteredPrintout, printoutSort]);

  useEffect(() => {
    if (activeSection !== "printout") {
      setPrintoutPage(1);
    }
  }, [activeSection]);

  useEffect(() => {
    if (!data) return;
    const totalPages = Math.max(1, Math.ceil(sortedPrintout.length / pageSize));
    setPrintoutPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [data, sortedPrintout.length]);

  useEffect(() => {
    if (activeSection === "printout") {
      setPrintoutPage(1);
    }
  }, [countRange, activeSection]);

  useEffect(() => {
    if (!showSentiment) return;
    if (isSentimentLoading) return;
    const key = countRange === "monthly" ? "monthly" : "allTime";
    if (sentimentSummary[key]) return;
    void loadSentimentSummary(key);
  }, [countRange, isSentimentLoading, loadSentimentSummary, sentimentSummary, showSentiment]);

  const countDisplay = useMemo(() => {
    const reflections = data?.reflections ?? null;
    const monthlyReflections = reflections
      ? (() => {
          const threshold = new Date();
          threshold.setDate(threshold.getDate() - 30);
          return reflections.filter(
            (reflection) => new Date(reflection.createdAt) >= threshold,
          );
        })()
      : null;
    const total =
      countRange === "monthly"
        ? monthlyReflections?.length ?? monthlyCounts.total
        : reflections?.length ?? allTimeCounts.total;
    const counts =
      countRange === "monthly"
        ? monthlyReflections
          ? {
              grounded: monthlyReflections.filter((r) => r.grounded).length,
              supported: monthlyReflections.filter((r) => r.supported).length,
              connected: monthlyReflections.filter((r) => r.connected).length,
              comments: monthlyReflections.filter((r) => r.feeling?.trim()).length,
            }
          : monthlyCounts
        : reflections
          ? {
              grounded: reflections.filter((r) => r.grounded).length,
              supported: reflections.filter((r) => r.supported).length,
              connected: reflections.filter((r) => r.connected).length,
              comments: reflections.filter((r) => r.feeling?.trim()).length,
            }
          : allTimeCounts;
    const formatCount = (count: number) => {
      if (total === 0) {
        return { count: "0", percent: "0%" };
      }
      return {
        count: String(count),
        percent: `${Math.round((count / total) * 100)}%`,
      };
    };
    return {
      total,
      grounded: formatCount(counts.grounded),
      supported: formatCount(counts.supported),
      connected: formatCount(counts.connected),
      comments: counts.comments,
    };
  }, [allTimeCounts, countRange, data, monthlyCounts]);

  const trendRange = countRange === "monthly" ? "monthly" : "allTime";

  useEffect(() => {
    if (!showTrends) return;
    if (trendData[trendRange]) return;
    void loadTrends(trendRange);
  }, [loadTrends, showTrends, trendData, trendRange]);

  const showMonthlyToggle =
    monthlyCounts.total > 0 && monthlyCounts.total !== reflectionsCount;
  const sentimentKey = countRange === "monthly" ? "monthly" : "allTime";
  const sentimentData = sentimentSummary[sentimentKey];
  const formattedSentimentScore =
    sentimentData?.sentimentScore == null
      ? "\u2014 / 100"
      : `${Math.round(sentimentData.sentimentScore)} / 100`;
  const topEmotions = sentimentData?.topEmotions ?? [];
  const primaryEmotion = topEmotions[0] ?? { label: "\u2014", count: 0 };
  const secondaryEmotion = topEmotions[1] ?? { label: "\u2014", count: 0 };
  const formatEmotionLabel = (label: string, capitalizeFirst: boolean) => {
    if (label === "\u2014") return label;
    const lowered = label.toLowerCase();
    return capitalizeFirst ? capitalize(lowered) : lowered;
  };

  return (
    <div className="relative z-10 w-full max-w-2xl px-5 xl:px-0 space-y-6">
      <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{t("healer.reflections.title")}</h2>
              <p className="text-sm text-gray-600">{t("healer.reflections.subtitle")}</p>
            </div>
            {showMonthlyToggle ? (
              <div className="flex flex-col overflow-hidden rounded-full border border-gray-200 bg-white/70 text-xs font-semibold uppercase tracking-wide sm:flex-row">
                <button
                  type="button"
                  className={`px-2.5 py-1 transition ${
                    countRange === "monthly"
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setCountRange("monthly")}
                  aria-pressed={countRange === "monthly"}
                >
                  {t("healer.monthly.toggle.month")}
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 transition ${
                    countRange === "allTime"
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setCountRange("allTime")}
                  aria-pressed={countRange === "allTime"}
                >
                  {t("healer.monthly.toggle.allTime")}
                </button>
              </div>
            ) : null}
          </div>
          <div className="my-4 border-t border-gray-200" />
          <div className="text-gray-700">
            <div className="flex items-center gap-2 text-sm font-medium leading-6">
              <span aria-hidden="true">💭</span>
              <p>
                {countDisplay.total === 1
                  ? "1 reflection shared in your space."
                  : `${countDisplay.total} reflections shared in your space.`}
              </p>
            </div>
            <div className="my-2 border-t border-dashed border-gray-200" />
            <div className="mt-2 flex items-center gap-2 text-sm font-medium leading-6 text-gray-700">
              <span aria-hidden="true">📝</span>
              <p>
                {countDisplay.comments} reflections include notes in their own voice.
              </p>
            </div>
            <div className="my-2 border-t border-dashed border-gray-200" />
            <div className="grid grid-cols-3 gap-3 text-xs font-medium sm:text-sm">
              <div className="flex justify-start">
                <div className="inline-grid place-items-center gap-0.5">
                  <span className="whitespace-nowrap">
                    {"🌱 "}Grounded {countDisplay.grounded.count}
                  </span>
                  <span className="text-xs font-normal text-gray-500">
                    {countDisplay.grounded.percent}
                  </span>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="inline-grid place-items-center gap-0.5">
                  <span className="whitespace-nowrap">
                    {"💛 "}Supported {countDisplay.supported.count}
                  </span>
                  <span className="text-xs font-normal text-gray-500">
                    {countDisplay.supported.percent}
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="inline-grid place-items-center gap-0.5">
                  <span className="whitespace-nowrap">
                    {"🤝 "}Connected {countDisplay.connected.count}
                  </span>
                  <span className="text-xs font-normal text-gray-500">
                    {countDisplay.connected.percent}
                  </span>
                </div>
              </div>
            </div>
            <div className="my-4 border-t border-gray-200" />
            <div className="mt-3 grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center">
              <button
                type="button"
                onClick={handleSentimentToggle}
                className="justify-self-start rounded bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-medium text-pulse-bloom-deep transition-colors hover:bg-pulse-bloom-soft-hover disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSentimentLoading}
              >
                <span className="flex flex-col items-center">
                  <span>
                    {showSentiment ? "✨ Hide NLP insights" : "✨ Explore NLP insights"}
                  </span>
                  {showSentiment && isSentimentLoading && !sentimentData && (
                    <span className="mt-1 flex w-full justify-center">
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500"
                      />
                      <span className="sr-only">Loading NLP insights...</span>
                    </span>
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSectionToggle("trends")}
                className="justify-self-start rounded bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-medium text-pulse-bloom-deep transition-colors hover:bg-pulse-bloom-soft-hover sm:justify-self-center"
              >
                <span className="flex flex-col items-center">
                  <span>
                    {activeSection === "trends"
                      ? "📈 Hide feeling trends"
                      : "📈 View feeling trends"}
                  </span>
                  {showTrends && isTrendLoading && (
                    <span className="mt-1 flex w-full justify-center">
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500"
                      />
                      <span className="sr-only">Loading feeling trends...</span>
                    </span>
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSectionToggle("printout")}
                className="justify-self-start rounded bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-medium text-pulse-bloom-deep transition-colors hover:bg-pulse-bloom-soft-hover sm:justify-self-end"
              >
                <span className="flex flex-col items-center">
                  <span>
                    {activeSection === "printout"
                      ? "🔍 Hide full reflection"
                      : "🔍 View full reflection"}
                  </span>
                  {showPrintout && isLoading && !data && (
                    <span className="mt-1 flex w-full justify-center">
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500"
                      />
                      <span className="sr-only">Loading reflections...</span>
                    </span>
                  )}
                </span>
              </button>
            </div>
            {showTrends && (
              <div className="mt-4">
                {trendError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p>{trendError}</p>
                    <button
                      type="button"
                      onClick={() => loadTrends(trendRange)}
                      className="mt-3 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
                    >
                      {t("healer.reflections.retry")}
                    </button>
                  </div>
                )}
                {trendData[trendRange] && (
                  <>
                    {trendData[trendRange]?.length ? (
                      <div className="mt-4 -mx-6 w-[calc(100%+3rem)] px-[1%]">
                        <TrendChart
                          data={trendData[trendRange] ?? []}
                          tooltipLabelMode={
                            trendRange === "monthly" ? "weekRange" : undefined
                          }
                        />
                      </div>
                    ) : (
                      <p className="mt-6 text-sm text-gray-500">
                        {t("reflection.addPrompt")}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
            {showSentiment && (
              <div className="mt-3 space-y-1 text-sm font-medium leading-6 text-gray-700">
                {sentimentError ? (
                  <p className="text-sm text-red-600">{sentimentError}</p>
                ) : isSentimentLoading && !sentimentData ? null : (
                  <>
                    <p>
                      <b>Through the lens of language:</b>
                    </p>
                    <div className="text-left">
                      <Tooltip
                        content={
                          <div className="space-y-1 text-left text-xs text-gray-700">
                            <p>
                              Emotion Label reflects the emotional nuance identified in the text.
                            </p>
                            <p>
                              Based on{" "}
                              <a
                                href="https://huggingface.co/SamLowe/roberta-base-go_emotions"
                                className="underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                GoEmotions model by Sam Lowe
                              </a>
                              .
                            </p>
                          </div>
                        }
                      >
                        <span className="text-left">
                          {"\u2013\u00a0"}
                          <b>
                            {formatEmotionLabel(primaryEmotion.label, true)}
                            {"\u00a0("}
                            {primaryEmotion.count}
                            {")"}
                          </b>
                          {secondaryEmotion.label !== "\u2014" &&
                          secondaryEmotion.count > 0 ? (
                            <>
                              {"\u00a0and\u00a0"}
                              <b>
                                {formatEmotionLabel(secondaryEmotion.label, false)}
                                {"\u00a0("}
                                {secondaryEmotion.count}
                                {")"}
                              </b>
                            </>
                          ) : null}
                          {"\u00a0"}feelings surfaced most.
                        </span>
                      </Tooltip>
                    </div>
                    <div className="text-left">
                      <Tooltip
                        content={
                          <div className="space-y-1 text-left text-xs text-gray-700">
                            <p>Sentiment Score reflects the emotional tone.</p>
                            <p>
                              Lower scores suggest heavier or more difficult reflections,
                            </p>
                            <p>higher scores suggest lighter or more positive tones.</p>
                            <p>
                              Powered by{" "}
                              <a
                                href="https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest"
                                className="underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                CardiffNLP&apos;s sentiment model
                              </a>
                              .
                            </p>
                          </div>
                        }
                      >
                        <span className="text-left">
                          {"\u2013\u00a0"}The emotional warmth was measured at
                          {"\u00a0"}
                          <b>{formattedSentimentScore}</b>.
                        </span>
                      </Tooltip>
                    </div>
                    <div className="my-3 border-gray-200" />
                    <div className="text-xs text-gray-500 text-left">
                      <p>
                        <sub>
                          ✨These insights were gently generated using natural language models from{" "}
                          <a
                            href="https://huggingface.co/"
                            className="underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Hugging Face
                          </a>
                          .{" "}
                          <span className="hidden md:inline">
                            Hover over scores for more details.
                          </span>
                          <span className="md:hidden">
                            Click scores for more details.
                          </span>
                        </sub>
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        {showPrintout && error && (
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
        {showPrintout && data && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadNlpInsights}
                className={
                  hasNlpInsights
                    ? "rounded-full border border-pulse-bloom bg-pulse-bloom px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-pulse-bloom/90 disabled:cursor-not-allowed disabled:opacity-60"
                    : "rounded-full border border-pulse-bloom bg-white px-3 py-1 text-xs font-semibold text-pulse-bloom shadow-sm transition hover:bg-pulse-bloom/10 disabled:cursor-not-allowed disabled:opacity-60"
                }
                aria-pressed={hasNlpInsights}
                aria-busy={isNlpLoading}
                disabled={isLoading || isNlpLoading || !data || hasNlpInsights}
              >
                Include NLP insights
              </button>
              <button
                type="button"
                onClick={() =>
                  setPrintoutSort((prev) => (prev === "desc" ? "asc" : "desc"))
                }
                className="rounded-full border border-pulse-bloom bg-white px-3 py-1 text-xs font-semibold text-pulse-bloom shadow-sm transition hover:bg-pulse-bloom/10"
                aria-pressed={printoutSort === "asc"}
              >
                {printoutSort === "desc" ? "Desc" : "Asc"}
              </button>
            </div>
            {nlpError && <p className="text-xs text-red-600">{nlpError}</p>}
            {sortedPrintout.length === 0 ? (
              <p className="text-sm text-gray-500">{t("reflection.none")}</p>
            ) : (
              (() => {
                const totalPages = Math.max(
                  1,
                  Math.ceil(sortedPrintout.length / pageSize),
                );
                const startIndex = (printoutPage - 1) * pageSize;
                const pageItems = sortedPrintout.slice(
                  startIndex,
                  startIndex + pageSize,
                );

                return (
                  <>
                    {pageItems.map((reflection) => {
                      const hasFeeling = Boolean(reflection.feeling?.trim());

                      return (
                        <div
                          key={reflection.id}
                          className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700"
                        >
                          <p className="mb-1">
                            <b>{t("reflection.grounded")}:</b>{" "}
                            {formatBool(reflection.grounded)}{" "}
                            <b className="ml-3">{t("reflection.supported")}:</b>{" "}
                            {formatBool(reflection.supported)}{" "}
                            <b className="ml-3">{t("reflection.connected")}:</b>{" "}
                            {formatBool(reflection.connected)}
                          </p>
                          {hasFeeling && (
                            <>
                              <p className="mb-2 text-base text-gray-800">
                                <b>{t("reflection.feeling")}:</b>{" "}
                                {reflection.feeling}
                              </p>
                              {hasNlpInsights && (
                                <>
                                  <p className="text-gray-500">
                                    {t("reflection.sentiment")}:{" "}
                                    {reflection.sentiment
                                      ? `${capitalize(reflection.sentiment.label)} (${Math.round(
                                          reflection.sentiment.score * 100,
                                        )} / 100)`
                                      : t("common.unavailable")}
                                  </p>
                                  <p className="text-gray-500">
                                    {t("reflection.emotion")}:{" "}
                                    {reflection.emotion?.label
                                      ? capitalize(reflection.emotion.label)
                                      : t("common.unavailable")}
                                  </p>
                                </>
                              )}
                            </>
                          )}
                          <p className="text-gray-500">
                            {t("reflection.created")}: {formatDate(reflection.createdAt)}
                          </p>
                        </div>
                      );
                    })}
                    {totalPages > 1 && (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPrintoutPage((prev) => Math.max(1, prev - 1))
                          }
                          className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={printoutPage <= 1}
                        >
                          Last page
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPrintoutPage((prev) => Math.min(totalPages, prev + 1))
                          }
                          className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={printoutPage >= totalPages}
                        >
                          Next page
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
