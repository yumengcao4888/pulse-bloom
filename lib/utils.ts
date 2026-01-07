import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ms from "ms";
import type { SentimentPrediction } from "@/lib/huggingface";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const timeAgo = (timestamp: Date, timeOnly?: boolean): string => {
  if (!timestamp) return "never";
  return `${ms(Date.now() - new Date(timestamp).getTime())}${
    timeOnly ? "" : " ago"
  }`;
};

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const json = await res.json();
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number;
      };
      error.status = res.status;
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }

  return res.json();
}

export function nFormatter(num: number, digits?: number) {
  if (!num) return "0";
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits || 1).replace(rx, "$1") + item.symbol
    : "0";
}

export function capitalize(str: string) {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const truncate = (str: string, length: number) => {
  if (!str || str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

export type Reflection = {
  grounded: boolean | null;
  supported: boolean | null;
  connected: boolean | null;
  createdAt: string | Date;
  sentiment?: SentimentPrediction | null;
};

export type ScoreSummary = {
  grounded: number | null;
  supported: number | null;
  connected: number | null;
  n: number;
};

export function avg100(values: (boolean | null | undefined)[]): number | null {
  const valid = values.filter((v) => v === true || v === false) as boolean[];
  if (valid.length === 0) return null;

  const mean = valid.reduce((sum, value) => sum + (value ? 1 : 0), 0) / valid.length;
  return Math.round(mean * 100);
}

const MONTHLY_WINDOW_DAYS = 30;

function aggregate(reflections: Reflection[]): ScoreSummary {
  return {
    grounded: avg100(reflections.map((r) => r.grounded)),
    supported: avg100(reflections.map((r) => r.supported)),
    connected: avg100(reflections.map((r) => r.connected)),
    n: reflections.length,
  };
}

function isAfterThreshold(reflection: { createdAt: string | Date }, threshold: Date) {
  return new Date(reflection.createdAt) >= threshold;
}

function getMonthlyThreshold() {
  const referenceDate = new Date();
  const monthlyThreshold = new Date(referenceDate);
  monthlyThreshold.setDate(referenceDate.getDate() - MONTHLY_WINDOW_DAYS);
  return monthlyThreshold;
}

export function getMonthlyReflections<T extends { createdAt: string | Date }>(
  reflections: T[],
) {
  return reflections.filter((reflection) =>
    isAfterThreshold(reflection, getMonthlyThreshold()),
  );
}

export function computeScores(reflections: Reflection[]) {
  const monthlyReflections = getMonthlyReflections(reflections);

  return {
    allTime: aggregate(reflections),
    monthly: aggregate(monthlyReflections),
  };
}

export type TrendPoint = {
  date: string;
  grounded: number | null;
  supported: number | null;
  connected: number | null;
};

function averagePercentage(values: boolean[]) {
  if (values.length === 0) return null;
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function averageNumber(values: number[]) {
  if (values.length === 0) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getDateParts(dateInput: string | Date, timeZone?: string) {
  if (!timeZone) {
    const date = new Date(dateInput);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      weekday: date.getDay(),
    };
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = formatter.formatToParts(new Date(dateInput));
  const partMap = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const weekday = WEEKDAY_INDEX[partMap.weekday ?? ""] ?? 0;

  return {
    year: Number(partMap.year),
    month: Number(partMap.month),
    day: Number(partMap.day),
    weekday,
  };
}

function formatDateKey(dateInput: string | Date, timeZone?: string) {
  const { year, month, day } = getDateParts(dateInput, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getWeekStartKey(dateInput: string | Date, timeZone?: string) {
  const { year, month, day, weekday } = getDateParts(dateInput, timeZone);
  const offset = (weekday + 6) % 7;
  const baseDate = new Date(Date.UTC(year, month - 1, day));
  baseDate.setUTCDate(baseDate.getUTCDate() - offset);
  return baseDate.toISOString().slice(0, 10);
}

export function getMonthStartKey(dateInput: string | Date, timeZone?: string) {
  const { year, month } = getDateParts(dateInput, timeZone);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function computeDailyTrends(
  reflections: Reflection[],
  timeZone?: string,
): TrendPoint[] {
  const byDay: Record<
    string,
    {
      grounded: boolean[];
      supported: boolean[];
      connected: boolean[];
    }
  > = {};

  reflections.forEach((reflection) => {
    const day = formatDateKey(reflection.createdAt, timeZone);

    const bucket =
      byDay[day] ??
      (byDay[day] = {
        grounded: [],
        supported: [],
        connected: [],
      });

    if (reflection.grounded !== null) bucket.grounded.push(reflection.grounded);
    if (reflection.supported !== null) bucket.supported.push(reflection.supported);
    if (reflection.connected !== null) bucket.connected.push(reflection.connected);
  });

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date,
      grounded: averagePercentage(stats.grounded),
      supported: averagePercentage(stats.supported),
      connected: averagePercentage(stats.connected),
    }));
}

export function computeWeeklyTrends(
  reflections: Reflection[],
  timeZone?: string,
): TrendPoint[] {
  const byWeek: Record<
    string,
    {
      grounded: boolean[];
      supported: boolean[];
      connected: boolean[];
    }
  > = {};

  reflections.forEach((reflection) => {
    const week = getWeekStartKey(reflection.createdAt, timeZone);

    const bucket =
      byWeek[week] ??
      (byWeek[week] = {
        grounded: [],
        supported: [],
        connected: [],
      });

    if (reflection.grounded !== null) bucket.grounded.push(reflection.grounded);
    if (reflection.supported !== null) bucket.supported.push(reflection.supported);
    if (reflection.connected !== null) bucket.connected.push(reflection.connected);
  });

  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date,
      grounded: averagePercentage(stats.grounded),
      supported: averagePercentage(stats.supported),
      connected: averagePercentage(stats.connected),
    }));
}

export function computeMonthlyTrends(
  reflections: Reflection[],
  timeZone?: string,
): TrendPoint[] {
  const byMonth: Record<
    string,
    {
      grounded: boolean[];
      supported: boolean[];
      connected: boolean[];
    }
  > = {};

  reflections.forEach((reflection) => {
    const month = getMonthStartKey(reflection.createdAt, timeZone);

    const bucket =
      byMonth[month] ??
      (byMonth[month] = {
        grounded: [],
        supported: [],
        connected: [],
      });

    if (reflection.grounded !== null) bucket.grounded.push(reflection.grounded);
    if (reflection.supported !== null) bucket.supported.push(reflection.supported);
    if (reflection.connected !== null) bucket.connected.push(reflection.connected);
  });

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date,
      grounded: averagePercentage(stats.grounded),
      supported: averagePercentage(stats.supported),
      connected: averagePercentage(stats.connected),
    }));
}

export function computeWeeklySentiment(
  reflections: Reflection[],
  timeZone?: string,
): Record<string, number | null> {
  const buckets: Record<string, number[]> = {};

  reflections.forEach((reflection) => {
    const score = reflection.sentiment?.score;
    if (score == null) return;
    const week = getWeekStartKey(reflection.createdAt, timeZone);
    const bucket = buckets[week] ?? (buckets[week] = []);
    bucket.push(score);
  });

  return Object.fromEntries(
    Object.entries(buckets).map(([week, values]) => {
      const average = averageNumber(values);
      return [week, average == null ? null : Math.round(average * 100)];
    }),
  );
}
