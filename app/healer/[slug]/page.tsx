import { classifyEmotion, classifyFeeling } from "@/lib/huggingface";
import { prisma } from "@/lib/prisma";
import {
  computeScores,
  getMonthlyReflections,
  computeWeeklySentiment,
  computeWeeklyTrends,
  capitalize,
} from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getTranslations } from "@/lib/i18n";
import { TrendChart } from "@/components/healer/trend-chart";
import MyWordcloud from "@/components/healer/simple-wordcloud";
import AutoPrint from "@/components/healer/auto-print";
import HealerProfileImage from "@/components/healer/healer-profile-image";
import type { Word } from "react-wordcloud";
import { clerkClient } from "@clerk/nextjs/server";

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

export default async function HealerPage(props: PageProps) {
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
  const contactTypeLabels = {
    email: t("form.healer.contact.type.email"),
    phone: t("form.healer.contact.type.phone"),
    website: t("form.healer.contact.type.website"),
    social: t("form.healer.contact.type.social"),
  } as const;

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

  let profileImageUrl = "/default-healer.jpg";
  if (healer.clerkId) {
    try {
      const client = await clerkClient();
      const healerUser = await client.users.getUser(healer.clerkId);
      if (healerUser.hasImage && healerUser.imageUrl) {
        profileImageUrl = healerUser.imageUrl;
      }
    } catch (err) {
      console.error("Failed to load healer profile image:", err);
    }
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
  const monthlySentiment = (() => {
    const recent = getMonthlyReflections(reflectionsWithAnalysis);
    const sentimentScores = recent
      .map((reflection) => reflection.sentiment?.score)
      .filter((score): score is number => score != null);
    if (sentimentScores.length === 0) return null;
    const avg = sentimentScores.reduce((total, value) => total + value, 0) / sentimentScores.length;
    return Math.round(avg * 100);
  })();
  const monthlySentimentDisplay =
    monthlySentiment == null ? t("common.none") : `${monthlySentiment} / 100`;

  const sentimentCounts = reflectionsWithAnalysis.reduce<Record<string, number>>(
    (acc, reflection) => {
      const label = reflection.sentiment?.label ?? t("common.unclassified");
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
      <AutoPrint />
      <div className="relative z-10 w-full max-w-xl px-5 xl:px-0">
        <div className="my-10 mx-auto max-w-xl flex flex-col items-center space-y-6">
          <HealerProfileImage
            src={profileImageUrl}
            alt={t("healer.profile.photoAlt")}
            width={200}
            height={200}
            className="rounded-full object-cover"
          />
          <div className="mb-5 flex min-w-0 w-full flex-col items-center gap-1 text-3xl font-semibold">
            <h1
              className="line-clamp-2 min-w-0 max-w-[60%] w-full break-all text-center"
              title={healer.name}
              aria-label={healer.name}
            >
              {healer.name}
            </h1>
            {healer.pronouns && (
              <span className="w-full text-center text-xl font-normal text-gray-600">
                ({healer.pronouns})
              </span>
            )}
          </div>
          <div className="w-full rounded-2xl border bg-white/70 p-6 shadow-sm">
            <p className="text-gray-700">
              <b>{t("healer.profile.approach")}</b> {healer.modality}
            </p>
            <p className="text-gray-700">
              <b>{t("healer.profile.workWith")}</b> {healer.focus}
            </p>
            <p className="text-gray-700">
              <b>{t("healer.profile.location")}</b> {healer.city}
            </p>
            {healer.contactType ? (
              <p className="text-gray-700">
                <b>
                  {healer.contactType === "other"
                    ? t("healer.profile.contact")
                    : `${contactTypeLabels[healer.contactType as keyof typeof contactTypeLabels]}:`}
                </b>{" "}
                {healer.contact}
              </p>
            ) : null}
            <p className="text-gray-700">
              <b>{t("healer.profile.about")}</b> {healer.bio}
            </p>
          </div>
          <div className="w-full rounded-2xl border bg-white/70 p-6 shadow-sm space-y-3">
            <h2 className="text-2xl font-semibold">{t("healer.monthly.title")}</h2>
            <div className="space-y-2 text-gray-700">
              <p><b>🌱 {t("healer.monthly.grounded")}</b></p>
              <p><b>{formatPercent(scores.monthly.grounded)}</b> {t("healer.monthly.grounded.value")}</p>
              <p><b>💛 {t("healer.monthly.supported")}</b></p>
              <p><b>{formatPercent(scores.monthly.supported)}</b> {t("healer.monthly.supported.value")}</p>
              <p><b>🤝 {t("healer.monthly.connected")}</b></p>
              <p><b>{formatPercent(scores.monthly.connected)}</b> {t("healer.monthly.connected.value")}</p>
              <p><b>🌤️ {t("healer.monthly.mood")}</b></p>
              <p>{t("healer.monthly.mood.value")} <b>{monthlySentimentDisplay}</b>.</p>
              <p><b>🗣️ {t("healer.monthly.topWords")}</b></p>
              <p>
                {t("healer.monthly.topWords.value")}{" "}
                {topWords.length > 0
                  ? topWords.map((word, index) => (
                      <span key={`${word}-${index}`}>
                        <b>
                          <i>{word}</i>
                        </b>
                        {index < topWords.length - 1 ? ", " : ""}
                      </span>
                    ))
                  : <b>{t("common.none")}</b>}
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
