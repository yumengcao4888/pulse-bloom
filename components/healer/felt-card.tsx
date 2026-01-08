"use client";

import { useState } from "react";
import LoadingCircle from "@/components/shared/icons/loading-circle";

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
  view?: "monthly" | "allTime";
  onViewChange?: (view: "monthly" | "allTime") => void;
};

export default function FeltCard({
  monthly,
  allTime,
  monthlyLabel,
  overTimeLabel,
  showToggle,
  defaultView = "monthly",
  view,
  onViewChange,
}: FeltCardProps) {
  const [internalView, setInternalView] = useState<"monthly" | "allTime">(defaultView);
  const currentView = view ?? internalView;
  const data = currentView === "monthly" ? monthly : allTime;
  const isMoodPending = data.moodValue.includes("—");
  const isTopWordsPending =
    data.topWords.length > 0 && data.topWords.every((word) => word.trim() === "—");
  const setView = (nextView: "monthly" | "allTime") => {
    if (!view) {
      setInternalView(nextView);
    }
    onViewChange?.(nextView);
  };
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
        <span className="hidden md:inline"> </span>
        <span className="block md:inline">{rest}</span>
      </>
    );
  };
  const renderTopWords = (words: string[]) =>
    words.map((word, index) => {
      const isLast = index === words.length - 1;
      const isSecondLast = index === words.length - 2;
      const separator =
        isLast ? "" : words.length === 2 ? " and " : isSecondLast ? ", and " : ", ";
      return (
        <span key={`${word}-${index}`}>
          <b>
            <i>{word}</i>
          </b>
          {separator}
        </span>
      );
    });

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
                currentView === "monthly" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setView("monthly")}
              aria-pressed={currentView === "monthly"}
            >
              {monthlyLabel}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 transition ${
                currentView === "allTime" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setView("allTime")}
              aria-pressed={currentView === "allTime"}
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
        <p>
          {data.moodValueLabel}{" "}
          <b>
            {isMoodPending ? (
              <span className="inline-flex items-center align-middle">
                <LoadingCircle />
              </span>
            ) : (
              data.moodValue
            )}
          </b>
          .
        </p>
        <div className="my-2 border-t border-dashed border-gray-200" />
        <p><b>🗣️ {data.topWordsLabel}</b></p>
        <p>
          {data.topWordsValueLabel}{" "}
          {isTopWordsPending ? (
            <span className="inline-flex items-center align-middle">
              <LoadingCircle />
            </span>
          ) : data.topWords.length > 0
            ? renderTopWords(data.topWords)
            : <b>{data.noneLabel}</b>}
          .
        </p>
      </div>
    </div>
  );
}
