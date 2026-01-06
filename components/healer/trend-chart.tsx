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
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const displayLabel = formatLabel ? formatLabel(label) : label;
  const order = ["connected", "grounded", "supported"];
  const items = order
    .map((key) => payload.find((entry) => entry.dataKey === key))
    .filter(Boolean);

  return (
    <div className="recharts-default-tooltip" style={tooltipStyle}>
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
}: {
  data: TrendPoint[];
  tooltipLabelMode?: "weekRange";
}) {
  const { t, locale } = useLocale();
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
          <Tooltip content={<TrendTooltip formatLabel={tooltipFormatter} />} />
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
