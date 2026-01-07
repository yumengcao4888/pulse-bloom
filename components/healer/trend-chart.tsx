"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { type TrendPoint } from "@/lib/utils";
import { useLocale } from "@/components/shared/locale-provider";

const tooltipStyle = {
  backgroundColor: "rgb(255, 255, 255)",
  border: "1px solid rgb(204, 204, 204)",
  padding: "10px",
  whiteSpace: "nowrap",
} as const;

function TrendTooltip({
  active,
  payload,
  label,
  formatLabel,
  onSelectPoint,
  selectedLabel,
  isCoarsePointer,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number | string;
    color?: string;
  }>;
  label?: string;
  formatLabel?: (label?: string) => string;
  onSelectPoint?: (label?: string) => void;
  selectedLabel?: string | null;
  isCoarsePointer?: boolean;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const displayLabel = formatLabel ? formatLabel(label) : label;
  const order = ["connected", "grounded", "supported"];
  const items = order
    .map((key) => payload.find((entry) => entry.dataKey === key))
    .filter(Boolean);
  const isClickable = Boolean(onSelectPoint);
  const isSelected = Boolean(selectedLabel && label && selectedLabel === label);
  const ctaVerb = isSelected ? "hide" : "view";
  const ctaLabel = isCoarsePointer
    ? `Tap to ${ctaVerb}`
    : `Click to ${ctaVerb}`;
  const allowContainerClick = isClickable && isCoarsePointer;

  return (
    <div
      className="recharts-default-tooltip"
      style={{
        ...tooltipStyle,
        cursor: allowContainerClick ? "pointer" : "default",
      }}
      onClick={
        allowContainerClick ? () => onSelectPoint?.(label) : undefined
      }
      onKeyDown={
        allowContainerClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectPoint?.(label);
              }
            }
          : undefined
      }
      role={allowContainerClick ? "button" : undefined}
      tabIndex={allowContainerClick ? 0 : undefined}
      aria-label={
        allowContainerClick && displayLabel
          ? `View reflections for ${displayLabel}`
          : undefined
      }
    >
      {displayLabel ? (
        <p
          className="recharts-tooltip-label"
          style={{ margin: 0, whiteSpace: "pre-line" }}
        >
          {displayLabel}
        </p>
      ) : null}
      <div style={{ display: "grid", rowGap: 0, marginTop: 4 }}>
        {items.map((entry) => (
          <div
            key={entry?.dataKey}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              columnGap: 12,
              alignItems: "baseline",
            }}
          >
            <span style={{ color: entry?.color }}>{entry?.name}</span>
            <span style={{ textAlign: "right" }}>{`${entry?.value}%`}</span>
          </div>
        ))}
      </div>
      {isClickable ? (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => onSelectPoint?.(label)}
            className="rounded-full bg-pulse-bloom-soft/30 px-3 py-1 text-xs font-semibold text-pulse-bloom-deep shadow-sm transition hover:bg-pulse-bloom-soft/50"
          >
            {ctaLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function formatWeekRangeLabel(label: string | undefined, locale: string) {
  if (!label) return "";
  const startLabel = label.slice(0, 10);
  const startDate = new Date(`${startLabel}T00:00:00`);
  if (Number.isNaN(startDate.getTime())) {
    return label;
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  });
  const startDisplay = formatter.format(startDate);
  const endDisplay = formatter.format(endDate);
  return `${startDisplay} -\n${endDisplay}`;
}

function useCoarsePointer() {
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarse(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return isCoarse;
}

export function TrendChart({
  data,
  tooltipLabelMode,
  onSelectPoint,
  selectedLabel,
}: {
  data: TrendPoint[];
  tooltipLabelMode?: "weekRange";
  onSelectPoint?: (label?: string) => void;
  selectedLabel?: string | null;
}) {
  const { t, locale } = useLocale();
  const isCoarsePointer = useCoarsePointer();
  const tooltipFormatter =
    tooltipLabelMode === "weekRange"
      ? (label?: string) => formatWeekRangeLabel(label, locale)
      : undefined;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip
            wrapperStyle={{ pointerEvents: "auto" }}
            content={
              <TrendTooltip
                formatLabel={tooltipFormatter}
                onSelectPoint={onSelectPoint}
                selectedLabel={selectedLabel}
                isCoarsePointer={isCoarsePointer}
              />
            }
          />
          <Legend />

          <Line
            type="monotone"
            dataKey="grounded"
            stroke="#F4C430"
            strokeWidth={2}
            dot={false}
            name={t("reflection.grounded")}
          />
          <Line
            type="monotone"
            dataKey="supported"
            stroke="#BAA1DD"
            strokeWidth={2}
            dot={false}
            name={t("reflection.supported")}
          />
          <Line
            type="monotone"
            dataKey="connected"
            stroke="#4FC3F7"
            strokeWidth={2}
            dot={false}
            name={t("reflection.connected")}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
