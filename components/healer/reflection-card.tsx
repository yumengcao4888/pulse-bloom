"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendChart } from "@/components/healer/trend-chart";
import { useLocale } from "@/components/shared/locale-provider";
import Tooltip from "@/components/shared/tooltip";
import { capitalize, fetcher } from "@/lib/utils";
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
  weeklyTrends: TrendPoint[];
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
  const [printoutPage, setPrintoutPage] = useState(1);
  const [printoutRange, setPrintoutRange] = useState<
    "all-time" | "week" | "month" | "year"
  >("all-time");
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

  const formatDate = (date: string) => new Date(date).toLocaleString(locale);
  const formatBool = (value: boolean | null | undefined) =>
    value == null ? t("common.na") : value ? t("common.yes") : t("common.no");

  const hasData = Boolean(data);
  const shouldShowContent = activeSection !== null;
  const handleSectionToggle = (section: SectionKey) => {
    setActiveSection((prev) => {
      const next = prev === section ? null : section;
      if (next) ensureDataLoaded();
      if (next === "printout") {
        setPrintoutRange("all-time");
      }
      return next;
    });
  };

  const filteredPrintout = useMemo(() => {
    if (!data) return [];
    if (printoutRange === "all-time") return data.reflections;

    const now = new Date();
    let startDate = new Date(0);

    if (printoutRange === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (printoutRange === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (printoutRange === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
    }

    return data.reflections.filter((reflection) => {
      const createdAt = new Date(reflection.createdAt);
      return createdAt >= startDate;
    });
  }, [data, printoutRange]);

  useEffect(() => {
    if (activeSection !== "printout") {
      setPrintoutPage(1);
    }
  }, [activeSection]);

  useEffect(() => {
    if (!data) return;
    const totalPages = Math.max(1, Math.ceil(filteredPrintout.length / pageSize));
    setPrintoutPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [data, filteredPrintout.length]);

  useEffect(() => {
    if (activeSection === "printout") {
      setPrintoutPage(1);
    }
  }, [printoutRange, activeSection]);

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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSentiment((prev) => !prev)}
                className="rounded bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-medium text-pulse-bloom-deep transition-colors hover:bg-pulse-bloom-soft-hover disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSentimentLoading}
              >
                {showSentiment ? "Hide NLP insights" : "Explore NLP insights"}
              </button>
            </div>
            {showSentiment && (
              <div className="mt-3 space-y-1 text-sm font-medium leading-6 text-gray-700">
                {sentimentError ? (
                  <p className="text-sm text-red-600">{sentimentError}</p>
                ) : isSentimentLoading && !sentimentData ? (
                  <p className="text-sm text-gray-500">Loading NLP insights...</p>
                ) : (
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
            <div className="my-4 border-t border-gray-200" />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSectionToggle("trends")}
                className="rounded bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-medium text-pulse-bloom-deep transition-colors hover:bg-pulse-bloom-soft-hover"
              >
                {activeSection === "trends"
                  ? "Hide over time weekly trends"
                  : "Over time weekly trends"}
              </button>
              <button
                type="button"
                onClick={() => handleSectionToggle("printout")}
                className="rounded bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-medium text-pulse-bloom-deep transition-colors hover:bg-pulse-bloom-soft-hover"
              >
                {activeSection === "printout"
                  ? "Hide reflection printout"
                  : "Reflection printout"}
              </button>
            </div>
          </div>
        {shouldShowContent && !hasData && isLoading && <ReflectionsSkeleton />}
        {shouldShowContent && error && (
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
                {activeSection === "trends" && (
                  <>
                    {data.weeklyTrends.length > 0 ? (
                      <div className="mt-6">
                        <TrendChart data={data.weeklyTrends} />
                      </div>
                    ) : (
                      <p className="mt-6 text-sm text-gray-500">
                        {t("reflection.addPrompt")}
                      </p>
                    )}
                  </>
                )}

                {activeSection === "printout" && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      <h3 className="text-base font-semibold text-gray-800">
                        About the Sentiment and Emotion Scores
                      </h3>
                      <p className="mt-2">
                        Each reflection includes a sentiment score (0-100) and a
                        suggested emotion, estimated by trusted open-source NLP
                        models.
                      </p>
                      <p className="mt-2">
                        <b>Sentiment Score</b> reflects the emotional tone - lower
                        scores suggest heavier or more difficult reflections, higher
                        scores suggest lighter or more positive tones.
                        <br />
                        {"-> "}Powered by{" "}
                        <a
                          href="https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest"
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          CardiffNLP&apos;s sentiment model
                        </a>
                      </p>
                      <p className="mt-2">
                        <b>Emotion Label</b> reflects the emotional nuance
                        identified in the text.
                        <br />
                        {"-> "}Based on{" "}
                        <a
                          href="https://huggingface.co/SamLowe/roberta-base-go_emotions"
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          GoEmotions model by Sam Lowe
                        </a>
                      </p>
                      <p className="mt-2">
                        These tools are here to help you notice gentle patterns -
                        there&apos;s no right or wrong way to feel.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPrintoutRange("all-time")}
                        className={
                          printoutRange === "all-time"
                            ? "rounded-full border border-pulse-bloom bg-pulse-bloom px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-pulse-bloom/90"
                            : "rounded-full border border-pulse-bloom bg-white px-3 py-1 text-xs font-semibold text-pulse-bloom shadow-sm transition hover:bg-pulse-bloom/10"
                        }
                      >
                        Over time
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintoutRange("week")}
                        className={
                          printoutRange === "week"
                            ? "rounded-full border border-pulse-bloom bg-pulse-bloom px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-pulse-bloom/90"
                            : "rounded-full border border-pulse-bloom bg-white px-3 py-1 text-xs font-semibold text-pulse-bloom shadow-sm transition hover:bg-pulse-bloom/10"
                        }
                      >
                        This week
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintoutRange("month")}
                        className={
                          printoutRange === "month"
                            ? "rounded-full border border-pulse-bloom bg-pulse-bloom px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-pulse-bloom/90"
                            : "rounded-full border border-pulse-bloom bg-white px-3 py-1 text-xs font-semibold text-pulse-bloom shadow-sm transition hover:bg-pulse-bloom/10"
                        }
                      >
                        This month
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintoutRange("year")}
                        className={
                          printoutRange === "year"
                            ? "rounded-full border border-pulse-bloom bg-pulse-bloom px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-pulse-bloom/90"
                            : "rounded-full border border-pulse-bloom bg-white px-3 py-1 text-xs font-semibold text-pulse-bloom shadow-sm transition hover:bg-pulse-bloom/10"
                        }
                      >
                        This year
                      </button>
                    </div>
                    {filteredPrintout.length === 0 ? (
                      <p className="text-sm text-gray-500">{t("reflection.none")}</p>
                    ) : (
                      (() => {
                        const totalPages = Math.max(
                          1,
                          Math.ceil(filteredPrintout.length / pageSize),
                        );
                        const startIndex = (printoutPage - 1) * pageSize;
                        const pageItems = filteredPrintout.slice(
                          startIndex,
                          startIndex + pageSize,
                        );

                        return (
                          <>
                            {pageItems.map((reflection) => (
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
                                <p className="mb-2 text-base text-gray-800">
                                  <b>{t("reflection.feeling")}:</b>{" "}
                                  {reflection.feeling ?? t("common.na")}
                                </p>
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
                                <p className="text-gray-500">
                                  {t("reflection.created")}:{" "}
                                  {formatDate(reflection.createdAt)}
                                </p>
                              </div>
                            ))}
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
                                    setPrintoutPage((prev) =>
                                      Math.min(totalPages, prev + 1),
                                    )
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
          </>
        )}
        </div>
      </div>
    </div>
  );
}
