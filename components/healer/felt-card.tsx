"use client";

import { useState } from "react";

export type FeltCardData = {
  title: string;
  groundedLabel: string;
  groundedValue: string;
  groundedValueLabel: string;
  supportedLabel: string;
  supportedValue: string;
  supportedValueLabel: string;
  connectedLabel: string;
  connectedValue: string;
  connectedValueLabel: string;
  moodLabel: string;
  moodValueLabel: string;
  moodValue: string;
  topWordsLabel: string;
  topWordsValueLabel: string;
  topWords: string[];
  noneLabel: string;
};

export type FeltCardProps = {
  monthly: FeltCardData;
  allTime: FeltCardData;
  monthlyLabel: string;
  overTimeLabel: string;
  showToggle: boolean;
  defaultView?: "monthly" | "allTime";
};

export default function FeltCard({
  monthly,
  allTime,
  monthlyLabel,
  overTimeLabel,
  showToggle,
  defaultView = "monthly",
}: FeltCardProps) {
  const [view, setView] = useState<"monthly" | "allTime">(defaultView);
  const data = view === "monthly" ? monthly : allTime;
  const renderTitle = (title: string) => {
    const commaIndex = title.indexOf(",");
    if (commaIndex === -1) {
      return title;
    }
    const first = title.slice(0, commaIndex + 1);
    const rest = title.slice(commaIndex + 1).trimStart();
    return (
      <>
        <span className="block md:inline">{first}</span>
        <span className="block md:inline md:before:content-[' ']">{rest}</span>
      </>
    );
  };

  return (
    <div className="w-full rounded-2xl border bg-white/70 p-6 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold whitespace-nowrap">
          {renderTitle(data.title)}
        </h2>
        {showToggle ? (
          <div className="flex flex-col overflow-hidden rounded-full border border-gray-200 bg-white/70 text-xs font-semibold uppercase tracking-wide sm:flex-row">
            <button
              type="button"
              className={`px-2.5 py-1 transition ${
                view === "monthly" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setView("monthly")}
              aria-pressed={view === "monthly"}
            >
              {monthlyLabel}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 transition ${
                view === "allTime" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setView("allTime")}
              aria-pressed={view === "allTime"}
            >
              {overTimeLabel}
            </button>
          </div>
        ) : null}
      </div>
      <div className="border-t border-gray-200" />
      <div className="text-gray-700">
        <p><b>🌱 {data.groundedLabel}</b></p>
        <p><b>{data.groundedValue}</b> {data.groundedValueLabel}</p>
        <div className="my-2 border-t border-dashed border-gray-200" />
        <p><b>💛 {data.supportedLabel}</b></p>
        <p><b>{data.supportedValue}</b> {data.supportedValueLabel}</p>
        <div className="my-2 border-t border-dashed border-gray-200" />
        <p><b>🤝 {data.connectedLabel}</b></p>
        <p><b>{data.connectedValue}</b> {data.connectedValueLabel}</p>
        <div className="my-2 border-t border-dashed border-gray-200" />
        <p><b>🌤️ {data.moodLabel}</b></p>
        <p>{data.moodValueLabel} <b>{data.moodValue}</b>.</p>
        <div className="my-2 border-t border-dashed border-gray-200" />
        <p><b>🗣️ {data.topWordsLabel}</b></p>
        <p>
          {data.topWordsValueLabel}{" "}
          {data.topWords.length > 0
            ? data.topWords.map((word, index) => (
                <span key={`${word}-${index}`}>
                  <b>
                    <i>{word}</i>
                  </b>
                  {index < data.topWords.length - 1 ? ", " : ""}
                </span>
              ))
            : <b>{data.noneLabel}</b>}
          .
        </p>
      </div>
    </div>
  );
}
