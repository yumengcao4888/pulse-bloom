"use client";

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
import useMediaQuery from "@/lib/hooks/use-media-query";

const tooltipStyle = {
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
  isMobile,
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
  isMobile?: boolean;
}) {
  const { t } = useLocale();

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
  const ctaLabel = isSelected
    ? isMobile
      ? t("healer.trend.tooltip.touch.hide")
      : t("healer.trend.tooltip.click.hide")
    : isMobile
      ? t("healer.trend.tooltip.touch.view")
      : t("healer.trend.tooltip.click.view");
  const allowContainerClick = isClickable && isMobile;

  return (
    <div
      className="recharts-default-tooltip rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm dark:border-[rgb(var(--dark-border))] dark:bg-[rgb(var(--dark-card))] dark:text-white"
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
          ? t("healer.trend.tooltip.aria", { label: displayLabel })
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
            onClick={
              allowContainerClick ? undefined : () => onSelectPoint?.(label)
            }
            className="rounded-full bg-pulse-bloom-soft/30 px-3 py-1 text-xs font-semibold text-pulse-bloom-deep shadow-sm transition hover:bg-pulse-bloom-soft/50 dark:bg-[rgb(var(--dark-cta))] dark:text-white dark:hover:bg-[rgb(var(--dark-cta-hover))]"
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
  const { isMobile } = useMediaQuery();
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
                isMobile={isMobile}
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
