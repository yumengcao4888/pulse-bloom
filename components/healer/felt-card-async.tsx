"use client";

import { useEffect, useState } from "react";
import FeltCard, { type FeltCardData, type FeltCardProps } from "@/components/healer/felt-card";
import { useLocale } from "@/components/shared/locale-provider";
import type { MessageKey } from "@/lib/i18n";

type AnalysisResponse = {
  monthlySentiment: number | null;
  allTimeSentiment: number | null;
  monthlyTopWords: string[];
  allTimeTopWords: string[];
};

type Props = FeltCardProps & {
  slug: string;
};

const formatSentiment = (value: number | null, fallback: string) =>
  value == null ? fallback : `${Math.round(value)} / 100`;

export default function FeltCardAsync({
  slug,
  monthly,
  allTime,
  monthlyLabel,
  overTimeLabel,
  showToggle,
  defaultView = "monthly",
}: Props) {
  const resetKey = [
    slug,
    defaultView,
    monthly.title,
    monthly.moodValue,
    monthly.topWords.join("|"),
    allTime.title,
    allTime.moodValue,
    allTime.topWords.join("|"),
  ].join("::");

  return (
    <FeltCardAsyncInner
      key={resetKey}
      slug={slug}
      monthly={monthly}
      allTime={allTime}
      monthlyLabel={monthlyLabel}
      overTimeLabel={overTimeLabel}
      showToggle={showToggle}
      defaultView={defaultView}
    />
  );
}

function FeltCardAsyncInner({
  slug,
  monthly,
  allTime,
  monthlyLabel,
  overTimeLabel,
  showToggle,
  defaultView = "monthly",
}: Props) {
  const { t } = useLocale();
  const [view, setView] = useState<"monthly" | "allTime">(defaultView);
  const [monthlyData, setMonthlyData] = useState<FeltCardData>(monthly);
  const [allTimeData, setAllTimeData] = useState<FeltCardData>(allTime);
  const [loaded, setLoaded] = useState({ monthly: false, allTime: false });
  const translateEmotionLabel = (label: string) => {
    const key = `emotion.${label.toLowerCase()}` as MessageKey;
    const translated = t(key);
    return translated !== key ? translated : label;
  };
  const translateTopWords = (words: string[]) => words.map(translateEmotionLabel);

  useEffect(() => {
    const controller = new AbortController();

    const loadAnalysis = async () => {
      try {
        if (view === "monthly" && loaded.monthly) return;
        if (view === "allTime" && loaded.allTime) return;
        const response = await fetch(`/api/healer/${slug}/analysis`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = (await response.json()) as AnalysisResponse;
        const monthlyTopWords = Array.isArray(data.monthlyTopWords)
          ? data.monthlyTopWords
          : [];
        const allTimeTopWords = Array.isArray(data.allTimeTopWords)
          ? data.allTimeTopWords
          : [];

        if (view === "monthly") {
          setMonthlyData((prev) => ({
            ...prev,
            moodValue: formatSentiment(data.monthlySentiment, prev.noneLabel),
            topWords: translateTopWords(monthlyTopWords),
          }));
          setLoaded((prev) => ({ ...prev, monthly: true }));
        } else {
          setAllTimeData((prev) => ({
            ...prev,
            moodValue: formatSentiment(data.allTimeSentiment, prev.noneLabel),
            topWords: translateTopWords(allTimeTopWords),
          }));
          setLoaded((prev) => ({ ...prev, allTime: true }));
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Failed to load healer analysis:", error);
      }
    };

    loadAnalysis();

    return () => {
      controller.abort();
    };
  }, [slug, t, view, loaded.monthly, loaded.allTime]);

  return (
    <FeltCard
      monthly={monthlyData}
      allTime={allTimeData}
      monthlyLabel={monthlyLabel}
      overTimeLabel={overTimeLabel}
      showToggle={showToggle}
      defaultView={defaultView}
      view={view}
      onViewChange={setView}
    />
  );
}
