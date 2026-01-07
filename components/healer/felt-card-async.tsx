"use client";

import { useEffect, useState } from "react";
import FeltCard, { type FeltCardData, type FeltCardProps } from "@/components/healer/felt-card";

type AnalysisResponse = {
  monthlySentiment: number | null;
  allTimeSentiment: number | null;
  topWords: string[];
};

type Props = FeltCardProps & {
  slug: string;
};

const formatSentiment = (value: number | null, fallback: string) =>
  value == null ? fallback : `${value} / 100`;

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
  const [view, setView] = useState<"monthly" | "allTime">(defaultView);
  const [monthlyData, setMonthlyData] = useState<FeltCardData>(monthly);
  const [allTimeData, setAllTimeData] = useState<FeltCardData>(allTime);
  const [loaded, setLoaded] = useState({ monthly: false, allTime: false });

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
        const topWords = Array.isArray(data.topWords) ? data.topWords : [];

        if (view === "monthly") {
          setMonthlyData((prev) => ({
            ...prev,
            moodValue: formatSentiment(data.monthlySentiment, prev.noneLabel),
            topWords,
          }));
          setLoaded((prev) => ({ ...prev, monthly: true }));
        } else {
          setAllTimeData((prev) => ({
            ...prev,
            moodValue: formatSentiment(data.allTimeSentiment, prev.noneLabel),
            topWords,
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
  }, [slug, view, loaded.monthly, loaded.allTime]);

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
