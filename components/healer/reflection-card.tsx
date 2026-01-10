"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TrendChart } from "@/components/healer/trend-chart";
import Modal from "@/components/shared/modal";
import { useLocale } from "@/components/shared/locale-provider";
import { delius, roboto } from "@/app/fonts";
import {
  capitalize,
  fetcher,
  getMonthStartKey,
  getMonthlyReflections,
  getWeekStartKey,
} from "@/lib/utils";
import type { TrendPoint } from "@/lib/utils";
import type { EmotionPrediction, SentimentPrediction } from "@/lib/huggingface";

type ReflectionEntry = {
  id: string;
  grounded: boolean | null;
  supported: boolean | null;
  connected: boolean | null;
  feeling: string | null;
  createdAt: string;
  heardAt: string | null;
  hidden: boolean;
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
  emotionalWarmth: number | null;
  topEmotions: { label: string; count: number }[];
  emotionCounts: { label: string; count: number }[];
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

const pad2 = (value: number) => String(value).padStart(2, "0");
const formatDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
const parseDateString = (value: string) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  const maxDay = daysInMonth(year, month);
  if (month < 1 || month > 12 || day < 1 || day > maxDay) return null;
  return { year, month, day };
};
const formatDateString = (year: number, month: number, day: number) =>
  `${year}-${pad2(month)}-${pad2(day)}`;
const normalizeDateParts = (year: number, month: number, day: number) => {
  const safeMonth = Math.min(12, Math.max(1, month));
  const maxDay = daysInMonth(year, safeMonth);
  const safeDay = Math.min(maxDay, Math.max(1, day));
  return { year, month: safeMonth, day: safeDay };
};
const getBaseDateParts = (value: string) => {
  const parsed = parseDateString(value);
  if (parsed) return parsed;
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
};
const updateDatePart = (
  value: string,
  part: "year" | "month" | "day",
  delta: number,
) => {
  const base = getBaseDateParts(value);
  const nextDate = new Date(base.year, base.month - 1, base.day);
  if (part === "year") {
    nextDate.setFullYear(nextDate.getFullYear() + delta);
  }
  if (part === "month") {
    nextDate.setMonth(nextDate.getMonth() + delta);
  }
  if (part === "day") {
    nextDate.setDate(nextDate.getDate() + delta);
  }
  return formatDateInput(nextDate);
};
const updateDatePartFromInput = (
  value: string,
  part: "year" | "month" | "day",
  inputValue: string,
) => {
  const parsed = Number(inputValue);
  if (!Number.isFinite(parsed)) return value;
  const base = getBaseDateParts(value);
  const next = { ...base };
  const safeValue = part === "year" ? Math.max(1, parsed) : parsed;
  if (part === "year") next.year = safeValue;
  if (part === "month") next.month = safeValue;
  if (part === "day") next.day = safeValue;
  const normalized = normalizeDateParts(next.year, next.month, next.day);
  return formatDateString(normalized.year, normalized.month, normalized.day);
};

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
  const [selectedTrendLabel, setSelectedTrendLabel] = useState<string | null>(null);
  const [trendPrintoutSort, setTrendPrintoutSort] = useState<"desc" | "asc">("desc");
  const [trendPrintoutPage, setTrendPrintoutPage] = useState(1);
  const [trendFreeTextOnly, setTrendFreeTextOnly] = useState(false);
  const [printoutSort, setPrintoutSort] = useState<"desc" | "asc">("desc");
  const [printoutFreeTextOnly, setPrintoutFreeTextOnly] = useState(false);
  const [printoutIncludeHidden, setPrintoutIncludeHidden] = useState(false);
  const [isPrintoutTimeOpen, setIsPrintoutTimeOpen] = useState(false);
  const [printoutStartDate, setPrintoutStartDate] = useState("");
  const [printoutEndDate, setPrintoutEndDate] = useState("");
  const [printoutDraftStart, setPrintoutDraftStart] = useState("");
  const [printoutDraftEnd, setPrintoutDraftEnd] = useState("");
  const [isPrintoutKeyboardOpen, setIsPrintoutKeyboardOpen] = useState(false);
  const [printoutViewportHeight, setPrintoutViewportHeight] = useState<number | null>(null);
  const [editingDatePartKey, setEditingDatePartKey] = useState<string | null>(null);
  const [editingDatePartValue, setEditingDatePartValue] = useState("");
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
  const [emotionPrintouts, setEmotionPrintouts] = useState<
    Record<string, ReflectionsPayload>
  >({});
  const [emotionLoading, setEmotionLoading] = useState<Record<string, boolean>>({});
  const [emotionErrors, setEmotionErrors] = useState<Record<string, string | null>>(
    {},
  );
  const [selectedEmotion, setSelectedEmotion] = useState<{
    label: string;
    count: number;
    allowHear: boolean;
  } | null>(null);
  const [emotionTitleOverride, setEmotionTitleOverride] = useState<string | null>(
    null,
  );
  const [emotionPrintoutSort, setEmotionPrintoutSort] = useState<"desc" | "asc">(
    "desc",
  );
  const [emotionPrintoutPage, setEmotionPrintoutPage] = useState(1);
  const [hearingUpdates, setHearingUpdates] = useState<Record<string, boolean>>({});
  const [hiddenUpdates, setHiddenUpdates] = useState<Record<string, boolean>>({});
  const [hiddenOverrides, setHiddenOverrides] = useState<Record<string, boolean>>({});
  const pageSize = 5;
  const noticeTextClass = "text-sm text-center text-gray-500 font-normal";
  const listTitleClass =
    "text-sm font-semibold text-gray-700 w-full text-center sm:w-auto sm:text-left";
  const printoutButtonClass =
    "inline-flex min-w-[160px] items-center justify-center gap-2 rounded-full border border-pulse-bloom bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-pulse-bloom/10";
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    [],
  );

  const loadReflections = useCallback(async () => {
    if (isLoading || data) return;
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetcher<ReflectionsPayload>(
        `/api/healer/${slug}/reflections?tz=${encodeURIComponent(timeZone)}`,
      );
      setData(payload);
    } catch (err) {
      console.error("Failed to load reflections", err);
      setError(t("reflection.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [data, isLoading, slug, t, timeZone]);

  const loadTrends = useCallback(
    async (range: "monthly" | "allTime") => {
      if (isTrendLoading || trendData[range]) return;
      setIsTrendLoading(true);
      setTrendError(null);
      try {
        const payload = await fetcher<TrendsPayload>(
          `/api/healer/${slug}/trends?range=${range}&tz=${encodeURIComponent(
            timeZone,
          )}`,
        );
        setTrendData((prev) => ({ ...prev, [range]: payload.trends }));
      } catch (err) {
        console.error("Failed to load trends", err);
        setTrendError(t("reflection.loadError"));
      } finally {
        setIsTrendLoading(false);
      }
    },
    [isTrendLoading, slug, t, timeZone, trendData],
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

  const formatTrendLabel = (label: string) => {
    if (countRange === "monthly") {
      const startDate = new Date(`${label}T00:00:00`);
      if (Number.isNaN(startDate.getTime())) return label;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      const formatter = new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      });
      return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
    }

    const monthDate = new Date(`${label}-01T00:00:00`);
    if (Number.isNaN(monthDate.getTime())) return label;
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(monthDate);
  };

  const formatDate = (date: string) => {
    const dateValue = new Date(date);
    const datePart = dateValue.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = dateValue.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${datePart} at ${timePart}`;
  };
  const formatPrintoutRangeTitle = (): React.ReactNode => {
    const formatter = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const today = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    if (printoutStartDate && printoutEndDate) {
      start = new Date(`${printoutStartDate}T00:00:00`);
      end = new Date(`${printoutEndDate}T00:00:00`);
    } else if (countRange === "monthly") {
      const rangeStart = new Date();
      rangeStart.setDate(rangeStart.getDate() - 30);
      start = rangeStart;
      end = today;
    } else {
      start = earliestReflectionDate ?? null;
      end = today;
    }

    if (!start || !end) return "Reflections";
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Reflections";
    }

    return (
      <>
        Reflections from {formatter.format(start)} -
        <br />
        {formatter.format(end)}
      </>
    );
  };
  const formatBool = (value: boolean | null | undefined) =>
    value == null ? t("common.na") : value ? t("common.yes") : t("common.no");
  const isPrintoutRangeActive = Boolean(printoutStartDate || printoutEndDate);
  const earliestReflectionDate = useMemo(() => {
    if (!data?.reflections?.length) return null;
    const earliest = data.reflections.reduce<Date | null>((earliestDate, reflection) => {
      const createdAt = new Date(reflection.createdAt);
      if (Number.isNaN(createdAt.getTime())) return earliestDate;
      if (!earliestDate || createdAt < earliestDate) return createdAt;
      return earliestDate;
    }, null);
    if (!earliest) return null;
    const normalized = new Date(earliest);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, [data]);
  const applyPrintoutDateChange = useCallback(
    (range: "start" | "end", nextValue: string) => {
      const maxDate = new Date();
      maxDate.setHours(0, 0, 0, 0);
      const minDate = earliestReflectionDate;
      const clampDateString = (value: string, min: Date | null, max: Date) => {
        if (!value) return value;
        const parsed = parseDateString(value);
        if (!parsed) return value;
        let next = new Date(parsed.year, parsed.month - 1, parsed.day);
        if (min && next < min) next = min;
        if (next > max) next = max;
        return formatDateInput(next);
      };
      const clamp = (value: string) => clampDateString(value, minDate, maxDate);
      let nextStart = range === "start" ? nextValue : printoutDraftStart;
      let nextEnd = range === "end" ? nextValue : printoutDraftEnd;

      if (nextStart) nextStart = clamp(nextStart);
      if (nextEnd) nextEnd = clamp(nextEnd);

      if (nextStart && nextEnd) {
        const startDate = new Date(`${nextStart}T00:00:00`);
        const endDate = new Date(`${nextEnd}T00:00:00`);
        if (startDate > endDate) {
          if (range === "start") {
            nextEnd = nextStart;
          } else {
            nextStart = nextEnd;
          }
        }
      }

      setPrintoutDraftStart(nextStart);
      setPrintoutDraftEnd(nextEnd);
    },
    [earliestReflectionDate, printoutDraftEnd, printoutDraftStart],
  );

  useEffect(() => {
    if (!isPrintoutTimeOpen) {
      setEditingDatePartKey(null);
      setEditingDatePartValue("");
    }
  }, [isPrintoutTimeOpen]);

  const getDefaultPrintoutRange = useCallback(() => {
    const today = new Date();
    if (countRange === "monthly") {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return {
        start: formatDateInput(start),
        end: formatDateInput(today),
      };
    }

    const reflections = data?.reflections ?? [];
    const earliest = reflections.reduce<Date | null>((earliestDate, reflection) => {
      const createdAt = new Date(reflection.createdAt);
      if (Number.isNaN(createdAt.getTime())) return earliestDate;
      if (!earliestDate || createdAt < earliestDate) return createdAt;
      return earliestDate;
    }, null);
    const start = earliest ?? today;
    return {
      start: formatDateInput(start),
      end: formatDateInput(today),
    };
  }, [countRange, data]);

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

  const handleTrendPointSelect = useCallback(
    (label?: string) => {
      if (!label) return;
      setSelectedTrendLabel((prev) => {
        const next = prev === label ? null : label;
        if (next && !data && !isLoading) {
          void loadReflections();
        }
        return next;
      });
      setTrendPrintoutPage(1);
    },
    [data, isLoading, loadReflections],
  );

  const handleSentimentToggle = () => {
    setShowSentiment((prev) => {
      const next = !prev;
      if (next) {
        setActiveSection(null);
      }
      return next;
    });
  };

  const loadEmotionPrintout = useCallback(
    async (label: string, range: "monthly" | "allTime") => {
      const key = `${range}:${label.toLowerCase()}`;
      if (emotionLoading[key] || emotionPrintouts[key]) return;
      setEmotionLoading((prev) => ({ ...prev, [key]: true }));
      setEmotionErrors((prev) => ({ ...prev, [key]: null }));
      try {
        const payload = await fetcher<ReflectionsPayload>(
          `/api/healer/${slug}/reflections-nlp-emotion?emotion=${encodeURIComponent(
            label,
          )}&range=${range}`,
        );
        setEmotionPrintouts((prev) => ({ ...prev, [key]: payload }));
      } catch (err) {
        console.error("Failed to load emotion reflections", err);
        setEmotionErrors((prev) => ({ ...prev, [key]: t("reflection.loadError") }));
      } finally {
        setEmotionLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [emotionLoading, emotionPrintouts, slug, t],
  );

  const handleEmotionSelect = (
    label: string,
    count: number,
    allowHear = false,
    titleOverride?: string,
  ) => {
    if (label === "\u2014" || count <= 0) return;
    const isSameEmotion =
      selectedEmotion?.label.toLowerCase() === label.toLowerCase() &&
      selectedEmotion?.allowHear === allowHear;
    setSelectedEmotion(isSameEmotion ? null : { label, count, allowHear });
    setEmotionTitleOverride(isSameEmotion ? null : titleOverride ?? null);
    setEmotionPrintoutPage(1);
    if (!isSameEmotion) {
      void loadEmotionPrintout(label, countRange);
    }
  };

  const updateSentimentCounts = useCallback(
    (label: string, delta: number) => {
      const key = countRange === "monthly" ? "monthly" : "allTime";
      const normalized = label.toLowerCase();
      setSentimentSummary((prev) => {
        const current = prev[key];
        if (!current) return prev;
        const nextCounts = current.emotionCounts.map((entry) =>
          entry.label.toLowerCase() === normalized
            ? { ...entry, count: Math.max(0, entry.count + delta) }
            : entry,
        );
        const hasMatch = nextCounts.some(
          (entry) => entry.label.toLowerCase() === normalized,
        );
        const finalCounts = hasMatch
          ? nextCounts
          : delta > 0
            ? [...nextCounts, { label, count: delta }]
            : nextCounts;
        return {
          ...prev,
          [key]: {
            ...current,
            emotionCounts: finalCounts.filter((entry) => entry.count > 0),
          },
        };
      });
    },
    [countRange],
  );

  const handleHearToggle = useCallback(
    async (reflectionId: string, isHeard: boolean, emotionLabel: string) => {
      if (hearingUpdates[reflectionId]) return;
      setHearingUpdates((prev) => ({ ...prev, [reflectionId]: true }));
      try {
        const res = await fetch("/api/reflection/heard", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: reflectionId, heard: !isHeard }),
        });
        if (!res.ok) {
          throw new Error("Failed to update heardAt");
        }
        const payload = await res.json();
        const nextHeardAt: string | null = payload?.reflection?.heardAt ?? null;
        const delta = nextHeardAt ? -1 : 1;
        updateSentimentCounts(emotionLabel, delta);
        setEmotionPrintouts((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((key) => {
            if (!next[key]?.reflections?.length) return;
            next[key] = {
              reflections: next[key].reflections.map((reflection) =>
                reflection.id === reflectionId
                  ? { ...reflection, heardAt: nextHeardAt }
                  : reflection,
              ),
            };
          });
          return next;
        });
      } catch (err) {
        console.error("Failed to update heardAt", err);
      } finally {
        setHearingUpdates((prev) => ({ ...prev, [reflectionId]: false }));
      }
    },
    [hearingUpdates, updateSentimentCounts],
  );

  const handleHiddenToggle = useCallback(async (reflectionId: string, isHidden: boolean) => {
    if (hiddenUpdates[reflectionId]) return;
    setHiddenUpdates((prev) => ({ ...prev, [reflectionId]: true }));
    try {
      const res = await fetch("/api/reflection/hidden", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reflectionId, hidden: !isHidden }),
      });
      if (!res.ok) {
        throw new Error("Failed to update hidden");
      }
      const payload = await res.json();
      const nextHidden = Boolean(payload?.reflection?.hidden);
      setHiddenOverrides((prev) => ({ ...prev, [reflectionId]: nextHidden }));
    } catch (err) {
      console.error("Failed to update hidden", err);
    } finally {
      setHiddenUpdates((prev) => ({ ...prev, [reflectionId]: false }));
    }
  }, [hiddenUpdates]);

  const filteredPrintout = useMemo(() => {
    if (!data) return [];
    const source = printoutIncludeHidden
      ? data.reflections
      : data.reflections.filter((reflection) => !reflection.hidden);
    if (countRange === "allTime") return source;
    return getMonthlyReflections(source);
  }, [countRange, data, printoutIncludeHidden]);
  const filteredPrintoutAll = useMemo(() => {
    if (!data) return [];
    if (countRange === "allTime") return data.reflections;
    return getMonthlyReflections(data.reflections);
  }, [countRange, data]);

  const printoutFilteredAll = useMemo(() => {
    const items = [...filteredPrintoutAll].filter((reflection) => {
      if (!printoutFreeTextOnly) return true;
      return Boolean(reflection.feeling?.trim());
    });
    const rangeStart = printoutStartDate
      ? new Date(`${printoutStartDate}T00:00:00`)
      : null;
    const rangeEnd = printoutEndDate
      ? new Date(`${printoutEndDate}T23:59:59.999`)
      : null;
    if (!rangeStart && !rangeEnd) return items;
    return items.filter((reflection) => {
      const createdAt = new Date(reflection.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;
      if (rangeStart && createdAt < rangeStart) return false;
      if (rangeEnd && createdAt > rangeEnd) return false;
      return true;
    });
  }, [
    filteredPrintoutAll,
    printoutFreeTextOnly,
    printoutStartDate,
    printoutEndDate,
  ]);

  const sortedPrintout = useMemo(() => {
    const items = [...filteredPrintout].filter((reflection) => {
      if (!printoutFreeTextOnly) return true;
      return Boolean(reflection.feeling?.trim());
    });
    const rangeStart = printoutStartDate
      ? new Date(`${printoutStartDate}T00:00:00`)
      : null;
    const rangeEnd = printoutEndDate
      ? new Date(`${printoutEndDate}T23:59:59.999`)
      : null;
    items.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return printoutSort === "asc" ? aTime - bTime : bTime - aTime;
    });
    if (!rangeStart && !rangeEnd) return items;
    return items.filter((reflection) => {
      const createdAt = new Date(reflection.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;
      if (rangeStart && createdAt < rangeStart) return false;
      if (rangeEnd && createdAt > rangeEnd) return false;
      return true;
    });
  }, [
    filteredPrintout,
    printoutFreeTextOnly,
    printoutSort,
    printoutStartDate,
    printoutEndDate,
  ]);

  const trendReflections = useMemo(() => {
    if (!data || !selectedTrendLabel) return [];
    return data.reflections.filter((reflection) => {
      if (reflection.hidden) return false;
      const bucketKey =
        countRange === "monthly"
          ? getWeekStartKey(reflection.createdAt, timeZone)
          : getMonthStartKey(reflection.createdAt, timeZone);
      if (bucketKey !== selectedTrendLabel) return false;
      if (!trendFreeTextOnly) return true;
      return Boolean(reflection.feeling?.trim());
    });
  }, [countRange, data, selectedTrendLabel, timeZone, trendFreeTextOnly]);
  const trendReflectionsAll = useMemo(() => {
    if (!data || !selectedTrendLabel) return [];
    return data.reflections.filter((reflection) => {
      const bucketKey =
        countRange === "monthly"
          ? getWeekStartKey(reflection.createdAt, timeZone)
          : getMonthStartKey(reflection.createdAt, timeZone);
      if (bucketKey !== selectedTrendLabel) return false;
      if (!trendFreeTextOnly) return true;
      return Boolean(reflection.feeling?.trim());
    });
  }, [countRange, data, selectedTrendLabel, timeZone, trendFreeTextOnly]);

  const sortedTrendReflections = useMemo(() => {
    const items = [...trendReflections];
    items.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return trendPrintoutSort === "asc" ? aTime - bTime : bTime - aTime;
    });
    return items;
  }, [trendPrintoutSort, trendReflections]);

  const trendPageItems = useMemo(() => {
    if (!selectedTrendLabel) return [];
    const startIndex = (trendPrintoutPage - 1) * pageSize;
    return sortedTrendReflections.slice(startIndex, startIndex + pageSize);
  }, [selectedTrendLabel, sortedTrendReflections, trendPrintoutPage]);

  useEffect(() => {
    if (activeSection !== "printout") {
      setPrintoutPage(1);
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "printout") {
      setPrintoutFreeTextOnly(false);
    }
  }, [activeSection]);

  useEffect(() => {
    if (!isPrintoutTimeOpen) return;
    if (printoutStartDate || printoutEndDate) {
      setPrintoutDraftStart(printoutStartDate);
      setPrintoutDraftEnd(printoutEndDate);
      return;
    }
    const defaults = getDefaultPrintoutRange();
    setPrintoutDraftStart(defaults.start);
    setPrintoutDraftEnd(defaults.end);
  }, [
    getDefaultPrintoutRange,
    isPrintoutTimeOpen,
    printoutEndDate,
    printoutStartDate,
  ]);

  useEffect(() => {
    if (showSentiment) return;
    setSelectedEmotion(null);
    setEmotionPrintoutPage(1);
  }, [showSentiment]);

  useEffect(() => {
    if (!selectedEmotion) return;
    void loadEmotionPrintout(selectedEmotion.label, countRange);
  }, [countRange, loadEmotionPrintout, selectedEmotion]);

  useEffect(() => {
    if (!data) return;
    const totalPages = Math.max(1, Math.ceil(sortedPrintout.length / pageSize));
    setPrintoutPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [data, sortedPrintout.length]);

  useEffect(() => {
    if (!selectedTrendLabel) return;
    const totalPages = Math.max(
      1,
      Math.ceil(sortedTrendReflections.length / pageSize),
    );
    setTrendPrintoutPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [selectedTrendLabel, sortedTrendReflections.length]);

  useEffect(() => {
    if (activeSection === "printout") {
      setPrintoutPage(1);
    }
  }, [countRange, activeSection]);

  useEffect(() => {
    if (!showTrends) {
      setSelectedTrendLabel(null);
      setTrendPrintoutPage(1);
      setTrendFreeTextOnly(false);
    }
  }, [showTrends]);

  useEffect(() => {
    if (!isPrintoutTimeOpen || typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboard = () => {
      const keyboardHeight = window.innerHeight - viewport.height;
      setIsPrintoutKeyboardOpen(keyboardHeight > 150);
      setPrintoutViewportHeight(Math.round(viewport.height));
    };

    updateKeyboard();
    viewport.addEventListener("resize", updateKeyboard);
    viewport.addEventListener("scroll", updateKeyboard);
    return () => {
      viewport.removeEventListener("resize", updateKeyboard);
      viewport.removeEventListener("scroll", updateKeyboard);
    };
  }, [isPrintoutTimeOpen]);

  useEffect(() => {
    setSelectedTrendLabel(null);
    setTrendPrintoutPage(1);
    setTrendFreeTextOnly(false);
  }, [countRange]);

  useEffect(() => {
    const defaults = getDefaultPrintoutRange();
    setPrintoutStartDate(defaults.start);
    setPrintoutEndDate(defaults.end);
    setPrintoutDraftStart(defaults.start);
    setPrintoutDraftEnd(defaults.end);
  }, [countRange, getDefaultPrintoutRange]);

  const emotionKey = selectedEmotion
    ? `${countRange}:${selectedEmotion.label.toLowerCase()}`
    : null;
  const emotionData = emotionKey ? emotionPrintouts[emotionKey] : null;
  const filteredEmotionPrintout = useMemo(
    () =>
      (emotionData?.reflections ?? []).filter(
        (reflection) => !reflection.hidden,
      ) as ReflectionEntry[],
    [emotionData],
  );
  const hasEmotionReflections = Boolean(emotionData?.reflections?.length);
  const hasHiddenEmotionReflections = Boolean(
    emotionData?.reflections?.some((reflection) => reflection.hidden),
  );
  const hasVisibleEmotionReflections = filteredEmotionPrintout.length > 0;
  const hasPrintoutReflections = printoutFilteredAll.length > 0;
  const hasHiddenPrintoutReflections = printoutFilteredAll.some(
    (reflection) => reflection.hidden,
  );
  const hasVisiblePrintoutReflections = sortedPrintout.length > 0;
  const showHiddenPrintoutNotice =
    !printoutIncludeHidden &&
    hasHiddenPrintoutReflections &&
    hasVisiblePrintoutReflections;
  const hasTrendReflections = trendReflectionsAll.length > 0;
  const hasHiddenTrendReflections = trendReflectionsAll.some(
    (reflection) => reflection.hidden,
  );
  const hasVisibleTrendReflections = sortedTrendReflections.length > 0;

  const sortedEmotionPrintout = useMemo(() => {
    const items = [...filteredEmotionPrintout];
    items.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return emotionPrintoutSort === "asc" ? aTime - bTime : bTime - aTime;
    });
    return items;
  }, [emotionPrintoutSort, filteredEmotionPrintout]);

  const emotionPageItems = useMemo(() => {
    if (!selectedEmotion) return [];
    const startIndex = (emotionPrintoutPage - 1) * pageSize;
    return sortedEmotionPrintout.slice(startIndex, startIndex + pageSize);
  }, [emotionPrintoutPage, selectedEmotion, sortedEmotionPrintout]);

  useEffect(() => {
    if (!selectedEmotion) return;
    const totalPages = Math.max(1, Math.ceil(sortedEmotionPrintout.length / pageSize));
    setEmotionPrintoutPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [selectedEmotion, sortedEmotionPrintout.length]);

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
  const hasNlpInsights = Boolean(
    sentimentData &&
      ((sentimentData.emotionCounts?.length ?? 0) > 0 ||
        sentimentData.emotionalWarmth != null),
  );
  const formattedEmotionalWarmth =
    sentimentData?.emotionalWarmth == null
      ? "\u2014 / 100"
      : `${Math.round(sentimentData.emotionalWarmth)} / 100`;
  const emotionCounts = useMemo(
    () => sentimentData?.emotionCounts ?? [],
    [sentimentData?.emotionCounts],
  );
  const topEmotionLabels = [
    "gratitude",
    "love",
    "admiration",
    "joy",
    "caring",
    "approval",
    "optimism",
    "pride",
    "relief",
    "excitement",
    "amusement",
    "desire",
    "curiosity",
    "surprise",
    "realization",
    "confusion",
    "neutral",
  ];
  const topEmotionPriority = new Map(
    topEmotionLabels.map((label, index) => [label, index]),
  );
  const displayTopEmotions = emotionCounts
    .filter((emotion) => topEmotionLabels.includes(emotion.label.toLowerCase()))
    .sort((a, b) => {
      const countDiff = b.count - a.count;
      if (countDiff !== 0) return countDiff;
      const aIndex =
        topEmotionPriority.get(a.label.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const bIndex =
        topEmotionPriority.get(b.label.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
  const primaryEmotion = displayTopEmotions[0] ?? { label: "\u2014", count: 0 };
  const secondaryEmotion = displayTopEmotions[1] ?? { label: "\u2014", count: 0 };
  const gentleEmotionLabels = [
    "sadness",
    "nervousness",
    "fear",
    "disappointment",
    "remorse",
    "embarrassment",
    "grief",
  ];
  const gentleEmotionPriority = new Map(
    gentleEmotionLabels.map((label, index) => [label, index]),
  );
  const gentleEmotions = emotionCounts
    .filter((emotion) =>
      gentleEmotionLabels.includes(emotion.label.toLowerCase()),
    )
    .sort((a, b) => {
      const countDiff = b.count - a.count;
      if (countDiff !== 0) return countDiff;
      const aIndex =
        gentleEmotionPriority.get(a.label.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const bIndex =
        gentleEmotionPriority.get(b.label.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    })
    .slice(0, 2);
  const gentlePrimaryEmotion = gentleEmotions[0] ?? { label: "\u2014", count: 0 };
  const gentleSecondaryEmotion = gentleEmotions[1] ?? { label: "\u2014", count: 0 };
  const harshEmotionLabels = ["annoyance", "disapproval", "anger", "disgust"];
  const harshEmotionPriority = new Map(
    harshEmotionLabels.map((label, index) => [label, index]),
  );
  const harshEmotions = emotionCounts
    .filter((emotion) =>
      harshEmotionLabels.includes(emotion.label.toLowerCase()),
    )
    .sort((a, b) => {
      const countDiff = b.count - a.count;
      if (countDiff !== 0) return countDiff;
      const aIndex =
        harshEmotionPriority.get(a.label.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const bIndex =
        harshEmotionPriority.get(b.label.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
  const harshPrimaryEmotion = harshEmotions[0] ?? { label: "\u2014", count: 0 };
  const getEmotionUnheardCount = useCallback(
    (label: string) => {
      if (!label || label === "\u2014") return 0;
      const normalized = label.toLowerCase();
      const key = `${countRange}:${normalized}`;
      const printout = emotionPrintouts[key];
      if (printout?.reflections?.length) {
        return printout.reflections.filter(
          (reflection) => reflection.heardAt == null,
        ).length;
      }
      return (
        emotionCounts.find((entry) => entry.label.toLowerCase() === normalized)
          ?.count ?? 0
      );
    },
    [countRange, emotionCounts, emotionPrintouts],
  );
  const gentlePrimaryUnheardCount = getEmotionUnheardCount(
    gentlePrimaryEmotion.label,
  );
  const gentleSecondaryUnheardCount = getEmotionUnheardCount(
    gentleSecondaryEmotion.label,
  );
  const harshPrimaryUnheardCount = getEmotionUnheardCount(
    harshPrimaryEmotion.label,
  );
  const showGentleLine =
    gentlePrimaryEmotion.label !== "\u2014" && gentlePrimaryUnheardCount > 0;
  const showHarshLine =
    harshPrimaryEmotion.label !== "\u2014" && harshPrimaryUnheardCount > 0;
  const showGentleSignals = showGentleLine || showHarshLine;
  const formatEmotionLabel = (label: string, capitalizeFirst: boolean) => {
    if (label === "\u2014") return label;
    const lowered = label.toLowerCase();
    return capitalizeFirst ? capitalize(lowered) : lowered;
  };
  const renderEmotionButton = (
    emotion: { label: string; count: number },
    capitalizeFirst: boolean,
    allowHear = false,
  ) => (
    <button
      type="button"
      onClick={() => handleEmotionSelect(emotion.label, emotion.count, allowHear)}
      className={`font-semibold underline decoration-dotted underline-offset-2 transition ${
        selectedEmotion?.label.toLowerCase() === emotion.label.toLowerCase()
          ? "text-pulse-bloom-deep"
          : "text-gray-800 hover:text-pulse-bloom-deep"
      }`}
      aria-pressed={
        selectedEmotion?.label.toLowerCase() === emotion.label.toLowerCase()
      }
      disabled={emotion.label === "\u2014" || emotion.count <= 0}
    >
      {formatEmotionLabel(emotion.label, capitalizeFirst)}
    </button>
  );

  const FeelingNote = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const textRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
      const el = textRef.current;
      if (!el) return;

      const updateOverflow = () => {
        setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
      };

      updateOverflow();
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(updateOverflow);
      observer.observe(el);
      return () => observer.disconnect();
    }, [text, isExpanded]);

    return (
      <div className="mb-1 pl-3 text-xs text-gray-900">
        <span
          ref={textRef}
          className={`${delius.className} block font-normal tracking-wider not-italic`}
          style={
            isExpanded
              ? undefined
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }
          }
        >
          {text}
        </span>
        {isOverflowing && !isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="mt-1 text-[11px] font-semibold text-pulse-bloom-deep underline decoration-dotted underline-offset-2 transition hover:text-pulse-bloom"
            aria-label="View more of this note"
          >
            View more
          </button>
        ) : null}
      </div>
    );
  };

  const renderReflectionItem = (
    reflection: ReflectionEntry,
    options?: {
      showHearButton?: boolean;
      emotionLabel?: string;
    },
  ) => {
    const hasFeeling = Boolean(reflection.feeling?.trim());
    const shouldShowHearButton =
      Boolean(options?.showHearButton) && hasFeeling && options?.emotionLabel;
    const isHeard = Boolean(reflection.heardAt);
    const isUpdating = hearingUpdates[reflection.id];
    const isHidden = hiddenOverrides[reflection.id] ?? Boolean(reflection.hidden);
    const isHiddenUpdating = hiddenUpdates[reflection.id];

    return (
      <div
        key={reflection.id}
        className="relative border-x border-b border-pulse-bloom px-4 py-2 text-sm text-gray-700 first:rounded-t-xl first:border-t last:rounded-b-xl"
      >
        <button
          type="button"
          onClick={() => handleHiddenToggle(reflection.id, isHidden)}
          className={`absolute right-2 top-1.5 rounded-full border px-2 py-0.5 text-[9px] font-semibold leading-none tracking-wide shadow-sm transition ${
            isHidden
              ? "border-gray-700 bg-gray-700 text-white dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-cta))] dark:text-white"
              : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-gray-200 dark:hover:bg-[rgb(var(--dark-card-hover))]"
          }`}
          disabled={isHiddenUpdating}
        >
          {isHidden ? "Hidden" : "Hide"}
        </button>
        <p
          className={`${roboto.className} mb-1 pl-3 text-xs font-light !italic tracking-wide text-gray-500 dark:text-white`}
        >
          {formatDate(reflection.createdAt)}
        </p>
        <p className="mb-1 flex flex-wrap items-center gap-3">
          <span
            className={
              reflection.grounded
                ? "rounded-full bg-[#F4C430] px-3 py-0.5 text-xs font-semibold text-gray-900"
                : "rounded-full border border-[#F4C430] px-3 py-0.5 text-xs font-semibold text-gray-700 opacity-30"
            }
          >
            {t("reflection.grounded")}
          </span>
          <span
            className={
              reflection.supported
                ? "rounded-full bg-[#BAA1DD] px-3 py-0.5 text-xs font-semibold text-gray-900"
                : "rounded-full border border-[#BAA1DD] px-3 py-0.5 text-xs font-semibold text-gray-700 opacity-30"
            }
          >
            {t("reflection.supported")}
          </span>
          <span
            className={
              reflection.connected
                ? "rounded-full bg-[#4FC3F7] px-3 py-0.5 text-xs font-semibold text-gray-900"
                : "rounded-full border border-[#4FC3F7] px-3 py-0.5 text-xs font-semibold text-gray-700 opacity-30"
            }
          >
            {t("reflection.connected")}
          </span>
        </p>
        {hasFeeling && (
          <>
            <FeelingNote text={reflection.feeling ?? ""} />
            {shouldShowHearButton ? (
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    handleHearToggle(
                      reflection.id,
                      isHeard,
                      options?.emotionLabel ?? "",
                    )
                  }
                  className={`inline-flex items-center justify-center rounded-full border border-pulse-bloom/30 bg-pulse-bloom-soft/20 px-3 py-1.5 text-xs font-semibold text-pulse-bloom-deep shadow-sm transition-colors hover:bg-pulse-bloom-soft-hover disabled:cursor-not-allowed disabled:opacity-60 ${
                    isHeard ? "border-pulse-bloom/80 bg-pulse-bloom/80 text-white" : ""
                  }`}
                  disabled={isUpdating}
                >
                  {isHeard ? "Heard" : "I hear you"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    );
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
            <div className="mt-3 grid w-full grid-cols-1 place-items-center gap-2 sm:grid-cols-3 sm:items-center">
              <button
                type="button"
                onClick={handleSentimentToggle}
                className="inline-flex w-full max-w-[260px] items-center justify-center justify-self-center rounded-full border border-pulse-bloom/30 bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-semibold text-pulse-bloom-deep shadow-sm transition-colors hover:bg-pulse-bloom-soft-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:max-w-none sm:justify-self-start dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-cta))] dark:text-white dark:shadow-md dark:hover:bg-[rgb(var(--dark-cta-hover))]"
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
                className="inline-flex w-full max-w-[260px] items-center justify-center justify-self-center rounded-full border border-pulse-bloom/30 bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-semibold text-pulse-bloom-deep shadow-sm transition-colors hover:bg-pulse-bloom-soft-hover sm:w-auto sm:max-w-none sm:justify-self-center dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-cta))] dark:text-white dark:shadow-md dark:hover:bg-[rgb(var(--dark-cta-hover))]"
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
                className="inline-flex w-full max-w-[260px] items-center justify-center justify-self-center rounded-full border border-pulse-bloom/30 bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-semibold text-pulse-bloom-deep shadow-sm transition-colors hover:bg-pulse-bloom-soft-hover sm:w-auto sm:max-w-none sm:justify-self-end dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-cta))] dark:text-white dark:shadow-md dark:hover:bg-[rgb(var(--dark-cta-hover))]"
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
                      <>
                        <div className="mt-4 -mx-6 w-[calc(100%+3rem)] px-[1%]">
                          <TrendChart
                            data={trendData[trendRange] ?? []}
                            tooltipLabelMode={
                              trendRange === "monthly" ? "weekRange" : undefined
                            }
                            onSelectPoint={handleTrendPointSelect}
                            selectedLabel={selectedTrendLabel}
                          />
                        </div>
                        {selectedTrendLabel && (
                          <div className="mt-4 space-y-4">
                            <div className="border-t border-dashed border-gray-200" />
                            {!(sortedTrendReflections.length === 0 && hasTrendReflections) ? (
                              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className={listTitleClass}>
                                  Reflections from{" "}
                                  {formatTrendLabel(selectedTrendLabel)}
                                </p>
                                <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTrendFreeTextOnly((prev) => !prev);
                                      setTrendPrintoutPage(1);
                                    }}
                                    className="inline-flex min-w-[160px] items-center justify-center rounded-full border border-pulse-bloom bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-pulse-bloom/10 sm:min-w-0"
                                    aria-pressed={trendFreeTextOnly}
                                  >
                                    {trendFreeTextOnly ? "💬 Show all" : "💬 Comments only"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTrendPrintoutSort((prev) =>
                                        prev === "desc" ? "asc" : "desc",
                                      )
                                    }
                                    className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-full border border-pulse-bloom bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-pulse-bloom/10 sm:min-w-0"
                                    aria-pressed={trendPrintoutSort === "asc"}
                                    aria-label={
                                      trendPrintoutSort === "desc"
                                        ? "Newest first"
                                        : "Oldest first"
                                    }
                                    title={
                                      trendPrintoutSort === "desc"
                                        ? "Newest first"
                                        : "Oldest first"
                                    }
                                  >
                                    <svg
                                      aria-hidden="true"
                                      className={`h-3.5 w-3.5 text-pulse-bloom transition-transform ${
                                        trendPrintoutSort === "asc"
                                          ? "rotate-180"
                                          : ""
                                    }`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M6 3v18" />
                                    <path d="M10 7l-4-4-4 4" />
                                    <path d="M18 21V3" />
                                    <path d="M14 17l4 4 4-4" />
                                  </svg>
                                  <span>
                                    {trendPrintoutSort === "desc"
                                      ? "Newest first"
                                      : "Oldest first"}
                                  </span>
                                </button>
                              </div>
                            </div>
                            ) : null}
                            {error ? (
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
                            ) : isLoading && !data ? (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500"
                                />
                                <span>Loading reflections...</span>
                              </div>
                            ) : sortedTrendReflections.length === 0 ? (
                              <p className={noticeTextClass}>
                                {hasTrendReflections
                                  ? t("reflection.noneVisible")
                                  : t("reflection.none")}
                              </p>
                            ) : (
                              (() => {
                                const showHiddenNotice =
                                  hasHiddenTrendReflections &&
                                  hasVisibleTrendReflections;
                                const totalPages = Math.max(
                                  1,
                                  Math.ceil(sortedTrendReflections.length / pageSize),
                                );

                                return (
                                  <>
                                    <div className="space-y-2">
                                      {showHiddenNotice ? (
                                      <p className={noticeTextClass}>
                                        {t("reflection.includesHidden")}
                                      </p>
                                      ) : null}
                                      <div className="space-y-0">
                                        {trendPageItems.map((reflection) =>
                                          renderReflectionItem(reflection),
                                        )}
                                      </div>
                                    </div>
                                {totalPages > 1 && (
                                  <div className="flex flex-row items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTrendPrintoutPage((prev) =>
                                          Math.max(1, prev - 1),
                                        )
                                      }
                                      className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-pulse-bloom-soft/20 disabled:cursor-not-allowed disabled:opacity-60"
                                      disabled={trendPrintoutPage <= 1}
                                    >
                                      Last page
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTrendPrintoutPage((prev) =>
                                          Math.min(totalPages, prev + 1),
                                        )
                                      }
                                      className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-pulse-bloom-soft/20 disabled:cursor-not-allowed disabled:opacity-60"
                                      disabled={trendPrintoutPage >= totalPages}
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
                ) : isSentimentLoading && !sentimentData ? null : !hasNlpInsights ? (
                  <div className="space-y-1 text-left">
                    <p>No reflections to read yet.</p>
                    <p className="text-xs font-normal italic text-gray-500">
                      Insights will bloom here once your clients share a few thoughts in
                      their own words.
                    </p>
                  </div>
                ) : (
                  <>
                    <p>
                      <b>{"\u00a0\u00a0"}Through the lens of language:</b>
                    </p>
                    <div className="text-left">
                      {primaryEmotion.label !== "\u2014" &&
                      primaryEmotion.count > 0 ? (
                        <span className="text-left">
                          {"\u2013\u00a0"}
                          {renderEmotionButton(primaryEmotion, true)}
                          {"\u00a0("}
                          {primaryEmotion.count}
                          {")"}
                          {secondaryEmotion.label !== "\u2014" &&
                          secondaryEmotion.count > 0 ? (
                            <>
                              {"\u00a0and\u00a0"}
                              {renderEmotionButton(secondaryEmotion, false)}
                              {"\u00a0("}
                              {secondaryEmotion.count}
                              {")"}
                            </>
                          ) : null}
                          {"\u00a0"}feelings surfaced most.
                        </span>
                      ) : null}
                    </div>
                    <div className="text-left">
                      <span className="text-left">
                        {"\u2013\u00a0"}The emotional warmth was measured at{"\u00a0"}
                        <b>{formattedEmotionalWarmth}</b>.
                      </span>
                    </div>
                    {showGentleSignals ? (
                      <div className="pt-2 space-y-1">
                        <p>
                          <b>{"\u00a0\u00a0"}Gentle signals to notice:</b>
                        </p>
                        <div className="text-left">
                          {showGentleLine ? (
                            <span className="text-left">
                              {"\u2013\u00a0"}Some reflections carried traces of{" "}
                              {renderEmotionButton(gentlePrimaryEmotion, false, true)}
                              {gentleSecondaryEmotion.label !== "\u2014" &&
                              gentleSecondaryUnheardCount > 0 ? (
                                <>
                                  {"\u00a0"}or{"\u00a0"}
                                  {renderEmotionButton(
                                    gentleSecondaryEmotion,
                                    false,
                                    true,
                                  )}
                                </>
                              ) : null}
                              .
                            </span>
                          ) : null}
                        </div>
                        <div className="text-left">
                          {showHarshLine ? (
                            <span className="text-left">
                              {"\u2013\u00a0"}
                              <button
                                type="button"
                                onClick={() =>
                                  handleEmotionSelect(
                                    harshPrimaryEmotion.label,
                                    harshPrimaryEmotion.count,
                                    true,
                                    "Reflections that felt a bit heavier",
                                  )
                                }
                                className="font-semibold underline decoration-dotted underline-offset-2 transition text-gray-800 hover:text-pulse-bloom-deep"
                              >
                                A few moments
                              </button>
                              {"\u00a0"}felt a bit heavier, perhaps asking for care.
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    <div className="my-3 border-gray-200" />
                    <div className="mb-3 text-xs text-gray-500 text-left">
                      <p>
                        <sub>
                          ✨These insights were gently generated using two NLP models:{" "}
                          <a
                            href="https://huggingface.co/SamLowe/roberta-base-go_emotions"
                            className="underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Sam Lowe&apos;s GoEmotions
                          </a>{" "}
                          and{" "}
                          <a
                            href="https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest"
                            className="underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                          CardiffNLP&apos;s sentiment model
                          </a>
                          .{" "}
                        </sub>
                      </p>
                    </div>
                    {selectedEmotion && (
                      <div className="pt-4 space-y-4 text-left">
                        <div className="border-t border-dashed border-gray-200" />
                        {emotionKey && emotionErrors[emotionKey] ? (
                          <p className="text-sm text-red-600">
                            {emotionErrors[emotionKey]}
                          </p>
                        ) : emotionKey && emotionLoading[emotionKey] ? (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span
                              aria-hidden="true"
                              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500"
                            />
                            <span>Loading reflections...</span>
                          </div>
                        ) : sortedEmotionPrintout.length === 0 ? (
                          <p className={noticeTextClass}>
                            {hasEmotionReflections
                              ? t("reflection.noneVisible")
                              : t("reflection.none")}
                          </p>
                        ) : (
                          (() => {
                            const shouldShowSort =
                              sortedEmotionPrintout.length > 0;
                            const showHiddenNotice =
                              hasHiddenEmotionReflections &&
                              hasVisibleEmotionReflections;
                            const totalPages = Math.max(
                              1,
                              Math.ceil(sortedEmotionPrintout.length / pageSize),
                            );

                            return (
                              <>
                                <div className="space-y-3">
                                  {shouldShowSort || showHiddenNotice ? (
                                    <div className="space-y-1">
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <p className={listTitleClass}>
                                          {emotionTitleOverride ??
                                            `Reflections with ${selectedEmotion.label} tone`}
                                        </p>
                                        {shouldShowSort ? (
                                          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-end">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setEmotionPrintoutSort((prev) =>
                                                  prev === "desc"
                                                    ? "asc"
                                                    : "desc",
                                                )
                                              }
                                              className="inline-flex items-center justify-center gap-2 rounded-full border border-pulse-bloom bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-pulse-bloom/10"
                                              aria-pressed={
                                                emotionPrintoutSort === "asc"
                                              }
                                              aria-label={
                                                emotionPrintoutSort === "desc"
                                                  ? "Newest first"
                                                  : "Oldest first"
                                              }
                                              title={
                                                emotionPrintoutSort === "desc"
                                                  ? "Newest first"
                                                  : "Oldest first"
                                              }
                                            >
                                              <svg
                                                aria-hidden="true"
                                                className={`h-3.5 w-3.5 text-pulse-bloom transition-transform ${
                                                  emotionPrintoutSort === "asc"
                                                    ? "rotate-180"
                                                    : ""
                                                }`}
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              >
                                                <path d="M6 3v18" />
                                                <path d="M10 7l-4-4-4 4" />
                                                <path d="M18 21V3" />
                                                <path d="M14 17l4 4 4-4" />
                                              </svg>
                                              <span>
                                                {emotionPrintoutSort === "desc"
                                                  ? "Newest first"
                                                  : "Oldest first"}
                                              </span>
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                      {showHiddenNotice ? (
                                        <p className={noticeTextClass}>
                                          {t("reflection.includesHidden")}
                                        </p>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  <div className="space-y-0">
                                    {emotionPageItems.map((reflection) =>
                                      renderReflectionItem(reflection, {
                                        showHearButton:
                                          selectedEmotion.allowHear,
                                        emotionLabel: selectedEmotion.label,
                                      }),
                                    )}
                                  </div>
                                </div>
                                {totalPages > 1 && (
                                  <div className="flex flex-row items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEmotionPrintoutPage((prev) =>
                                          Math.max(1, prev - 1),
                                        )
                                      }
                                      className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-pulse-bloom-soft/20 disabled:cursor-not-allowed disabled:opacity-60"
                                      disabled={emotionPrintoutPage <= 1}
                                    >
                                      Last page
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEmotionPrintoutPage((prev) =>
                                          Math.min(totalPages, prev + 1),
                                        )
                                      }
                                      className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-pulse-bloom-soft/20 disabled:cursor-not-allowed disabled:opacity-60"
                                      disabled={emotionPrintoutPage >= totalPages}
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
            <div className="flex flex-col gap-2 sm:gap-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className={listTitleClass}>{formatPrintoutRangeTitle()}</p>
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setPrintoutFreeTextOnly((prev) => !prev);
                      setPrintoutPage(1);
                    }}
                    className={printoutButtonClass}
                    aria-pressed={printoutFreeTextOnly}
                  >
                    {printoutFreeTextOnly ? "💬 Show all" : "💬 Comments only"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPrintoutSort((prev) =>
                        prev === "desc" ? "asc" : "desc",
                      )
                    }
                    className={printoutButtonClass}
                    aria-pressed={printoutSort === "asc"}
                    aria-label={
                      printoutSort === "desc" ? "Newest first" : "Oldest first"
                    }
                    title={
                      printoutSort === "desc" ? "Newest first" : "Oldest first"
                    }
                  >
                    <svg
                      aria-hidden="true"
                      className={`h-3.5 w-3.5 text-pulse-bloom transition-transform ${
                        printoutSort === "asc" ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 3v18" />
                      <path d="M10 7l-4-4-4 4" />
                      <path d="M18 21V3" />
                      <path d="M14 17l4 4 4-4" />
                    </svg>
                    <span>
                      {printoutSort === "desc" ? "Newest first" : "Oldest first"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 sm:-mt-1 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPrintoutIncludeHidden((prev) => !prev)}
                  className={printoutButtonClass}
                  aria-pressed={printoutIncludeHidden}
                >
                  {printoutIncludeHidden ? "🙈 Hide again" : "🙈 Show hidden"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintoutTimeOpen(true)}
                  className={printoutButtonClass}
                >
                  📆 Choose dates
                </button>
              </div>
            </div>
            {showHiddenPrintoutNotice ? (
              <p className={`${noticeTextClass} -mb-2 sm:-mt-1`}>
                {t("reflection.includesHidden")}
              </p>
            ) : null}
            {sortedPrintout.length === 0 ? (
              <p className={noticeTextClass}>
                {hasPrintoutReflections
                  ? t("reflection.noneVisible")
                  : t("reflection.none")}
              </p>
            ) : (
              (() => {
                const totalPages = Math.max(
                  1,
                  Math.ceil(sortedPrintout.length / pageSize),
                );
                const printoutListOffsetClass = showHiddenPrintoutNotice
                  ? "-mt-4"
                  : "";
                const startIndex = (printoutPage - 1) * pageSize;
                const pageItems = sortedPrintout.slice(
                  startIndex,
                  startIndex + pageSize,
                );

                return (
                  <>
                    <div className={`space-y-0 ${printoutListOffsetClass}`}>
                      {pageItems.map((reflection) =>
                        renderReflectionItem(reflection),
                      )}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex flex-row items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPrintoutPage((prev) => Math.max(1, prev - 1))
                          }
                          className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-pulse-bloom-soft/20 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={printoutPage <= 1}
                        >
                          Last page
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPrintoutPage((prev) => Math.min(totalPages, prev + 1))
                          }
                          className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-pulse-bloom-soft/20 disabled:cursor-not-allowed disabled:opacity-60"
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
            <Modal
              open={isPrintoutTimeOpen}
              setOpen={setIsPrintoutTimeOpen}
              title="Change time range"
              contentStyle={
                isPrintoutKeyboardOpen && printoutViewportHeight
                  ? { height: printoutViewportHeight }
                  : undefined
              }
              className={
                isPrintoutKeyboardOpen
                  ? "mt-0 max-h-none overflow-y-auto sm:mt-24 sm:max-h-fit sm:overflow-visible"
                  : "mt-24 max-h-[85dvh] overflow-y-auto sm:mt-24 sm:max-h-fit sm:overflow-visible"
              }
            >
              <div className="w-full bg-white p-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    🕰️ Choose a time range
                  </h3>
                  <p className="text-sm text-gray-500">
                    Pick the start and end dates you&apos;d like to explore. You can use
                    the spinners or type the dates directly.
                  </p>
                </div>
                <div className="mt-5 grid gap-4">
                  {[
                    {
                      id: "start" as const,
                      label: "Start date",
                      value: printoutDraftStart,
                    },
                    {
                      id: "end" as const,
                      label: "End date",
                      value: printoutDraftEnd,
                    },
                  ].map(({ id, label, value }) => {
                    const parsed = parseDateString(value);
                    const displayYear = parsed ? String(parsed.year) : "----";
                    const displayMonth = parsed ? pad2(parsed.month) : "--";
                    const displayDay = parsed ? pad2(parsed.day) : "--";

                    return (
                      <div key={label} className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">{label}</p>
                        <div className="mx-auto w-fit rounded-2xl bg-pulse-bloom-soft/30 p-3 shadow-sm">
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            {[
                              {
                                value: displayYear,
                                part: "year" as const,
                                widthClass: "w-[6ch]",
                              },
                              {
                                value: displayMonth,
                                part: "month" as const,
                                widthClass: "w-[4ch]",
                              },
                              {
                                value: displayDay,
                                part: "day" as const,
                                widthClass: "w-[4ch]",
                              },
                            ].map((item) => (
                              <div key={item.part} className="flex flex-col items-center gap-0.5">
                                {(() => {
                                  const editKey = `${id}-${item.part}`;
                                  const isEditing = editingDatePartKey === editKey;
                                  const maxLength = item.part === "year" ? 4 : 2;
                                  const initialValue = parsed
                                    ? item.part === "year"
                                      ? String(parsed.year)
                                      : pad2(parsed[item.part])
                                    : "";
                                  const commitEdit = () => {
                                    if (!isEditing) return;
                                    if (editingDatePartValue.trim()) {
                                      applyPrintoutDateChange(
                                        id,
                                        updateDatePartFromInput(
                                          value,
                                          item.part,
                                          editingDatePartValue,
                                        ),
                                      );
                                    }
                                    setEditingDatePartKey(null);
                                    setEditingDatePartValue("");
                                  };
                                  const cancelEdit = () => {
                                    setEditingDatePartKey(null);
                                    setEditingDatePartValue("");
                                  };

                                  return (
                                    <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    applyPrintoutDateChange(
                                      id,
                                      updateDatePart(value, item.part, 1),
                                    )
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-pulse-bloom/80 text-[10px] font-semibold uppercase leading-none tracking-wide text-white transition hover:bg-pulse-bloom-deep"
                                  aria-label={`${label} ${item.part} up`}
                                >
                                  <svg
                                    viewBox="0 0 12 12"
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                    focusable="false"
                                  >
                                    <path d="M6 3l3.5 4.5h-7L6 3z" fill="currentColor" />
                                  </svg>
                                </button>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={editingDatePartValue}
                                    onChange={(event) => {
                                      const next = event.target.value.replace(/\D/g, "");
                                      setEditingDatePartValue(next.slice(0, maxLength));
                                    }}
                                    onBlur={commitEdit}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        commitEdit();
                                      }
                                      if (event.key === "Escape") {
                                        event.preventDefault();
                                        cancelEdit();
                                      }
                                    }}
                                    autoFocus
                                    className={`h-12 rounded-lg bg-white px-3 py-2 text-center text-2xl font-semibold leading-none tabular-nums tracking-wide text-gray-600 shadow-inner focus:outline-none focus:ring-2 focus:ring-pulse-bloom/40 ${item.widthClass}`}
                                    aria-label={`${label} ${item.part} value`}
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingDatePartKey(editKey);
                                      setEditingDatePartValue(initialValue);
                                    }}
                                    className={`inline-flex h-12 items-center justify-center rounded-lg bg-white px-3 py-2 text-center text-2xl font-semibold leading-none tabular-nums tracking-wide text-gray-600 shadow-inner transition hover:bg-pulse-bloom/10 ${item.widthClass}`}
                                    aria-label={`${label} ${item.part} value`}
                                  >
                                    {item.value}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    applyPrintoutDateChange(
                                      id,
                                      updateDatePart(value, item.part, -1),
                                    )
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-pulse-bloom/80 text-[10px] font-semibold uppercase leading-none tracking-wide text-white transition hover:bg-pulse-bloom-deep"
                                  aria-label={`${label} ${item.part} down`}
                                >
                                  <svg
                                    viewBox="0 0 12 12"
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                    focusable="false"
                                  >
                                    <path d="M6 9L2.5 4.5h7L6 9z" fill="currentColor" />
                                  </svg>
                                </button>
                                    </>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const defaults = getDefaultPrintoutRange();
                      setPrintoutDraftStart(defaults.start);
                      setPrintoutDraftEnd(defaults.end);
                      setPrintoutStartDate("");
                      setPrintoutEndDate("");
                      setPrintoutPage(1);
                    }}
                    className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintoutTimeOpen(false)}
                    className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      let start = printoutDraftStart;
                      let end = printoutDraftEnd;
                      if (start && end) {
                        const startDate = new Date(`${start}T00:00:00`);
                        const endDate = new Date(`${end}T00:00:00`);
                        if (startDate > endDate) {
                          [start, end] = [end, start];
                        }
                      }
                      setPrintoutStartDate(start);
                      setPrintoutEndDate(end);
                      setPrintoutPage(1);
                      setIsPrintoutTimeOpen(false);
                    }}
                    className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
