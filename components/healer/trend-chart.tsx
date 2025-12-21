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

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const { t } = useLocale();

  return (
    <div className="rounded-2xl border bg-white/70 p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-gray-800">
        {t("healer.trend.title")}
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
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
    </div>
  );
}
