"use client";

import { useEffect, useState } from "react";
import WhatWeFeltCard, {
  type FeltCardData,
  type WhatWeFeltCardProps,
} from "@/components/healer/what-we-felt-card";

type AnalysisResponse = {
  monthlySentiment: number | null;
  allTimeSentiment: number | null;
  topWords: string[];
};

type Props = WhatWeFeltCardProps & {
  slug: string;
};

const formatSentiment = (value: number | null, fallback: string) =>
  value == null ? fallback : `${value} / 100`;

export default function WhatWeFeltCardAsync({
  slug,
  monthly,
  allTime,
  monthlyLabel,
  allTimeLabel,
  showToggle,
  defaultView = "monthly",
}: Props) {
  const [monthlyData, setMonthlyData] = useState<FeltCardData>(monthly);
  const [allTimeData, setAllTimeData] = useState<FeltCardData>(allTime);

  useEffect(() => {
    const controller = new AbortController();

    const loadAnalysis = async () => {
      try {
        const response = await fetch(`/api/healer/${slug}/analysis`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = (await response.json()) as AnalysisResponse;
        const topWords = Array.isArray(data.topWords) ? data.topWords : [];

        setMonthlyData((prev) => ({
          ...prev,
          moodValue: formatSentiment(data.monthlySentiment, prev.noneLabel),
          topWords,
        }));

        setAllTimeData((prev) => ({
          ...prev,
          moodValue: formatSentiment(data.allTimeSentiment, prev.noneLabel),
          topWords,
        }));
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Failed to load healer analysis:", error);
      }
    };

    loadAnalysis();

    return () => {
      controller.abort();
    };
  }, [slug]);

  return (
    <WhatWeFeltCard
      monthly={monthlyData}
      allTime={allTimeData}
      monthlyLabel={monthlyLabel}
      allTimeLabel={allTimeLabel}
      showToggle={showToggle}
      defaultView={defaultView}
    />
  );
}
