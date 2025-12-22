"use client";

import { useState } from "react";

type PrintProfileButtonProps = {
  slug: string;
};

export default function PrintProfileButton({ slug }: PrintProfileButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    const url = `/healer/${slug}?print=1`;
    const printWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!printWindow) {
      setIsPrinting(false);
      return;
    }

    const onReady = () => {
      setIsPrinting(false);
    };

    printWindow.addEventListener("load", onReady, { once: true });
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={isPrinting}
      aria-busy={isPrinting}
      className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-300"
    >
      {isPrinting ? "Preparing PDF..." : "Download PDF"}
    </button>
  );
}
