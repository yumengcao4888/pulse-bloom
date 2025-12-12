import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ms from "ms";

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

function isAfterThreshold(reflection: Reflection, threshold: Date) {
  return new Date(reflection.createdAt) >= threshold;
}

export function computeScores(reflections: Reflection[]) {
  const referenceDate = new Date();
  const monthlyThreshold = new Date(referenceDate);
  monthlyThreshold.setDate(referenceDate.getDate() - MONTHLY_WINDOW_DAYS);

  const monthlyReflections = reflections.filter((reflection) =>
    isAfterThreshold(reflection, monthlyThreshold),
  );

  return {
    allTime: aggregate(reflections),
    monthly: aggregate(monthlyReflections),
  };
}
