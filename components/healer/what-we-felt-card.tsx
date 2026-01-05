"use client";

import { useState } from "react";

type FeltCardData = {
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

type Props = {
  monthly: FeltCardData;
  allTime: FeltCardData;
  monthlyLabel: string;
  allTimeLabel: string;
};

export default function WhatWeFeltCard({
  monthly,
  allTime,
  monthlyLabel,
  allTimeLabel,
}: Props) {
  const [view, setView] = useState<"monthly" | "allTime">("monthly");
  const data = view === "monthly" ? monthly : allTime;
  const titleParts = data.title.split(",");
  const titleMain = titleParts[0] ?? data.title;
  const titleRemainder = titleParts.slice(1).join(",").trim();

  return (
    <div className="w-full rounded-2xl border bg-white/70 p-6 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">
          {titleRemainder ? (
            <>
              {titleMain},
              <span className="block sm:inline"> {titleRemainder}</span>
            </>
          ) : (
            data.title
          )}
        </h2>
        <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white/70 text-xs font-semibold uppercase tracking-wide">
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
            {allTimeLabel}
          </button>
        </div>
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
