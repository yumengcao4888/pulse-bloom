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
      className="rounded bg-pulse-bloom-soft/20 px-4 py-2 text-sm font-medium text-pulse-bloom-deep transition-colors hover:bg-pulse-bloom-soft-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPrinting ? "Preparing PDF..." : "Download PDF"}
    </button>
  );
}
