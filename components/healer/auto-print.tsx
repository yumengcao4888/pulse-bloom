"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AutoPrint() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("print") !== "1") {
      return;
    }

    const timer = window.setTimeout(() => {
      window.focus();
      window.print();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  return null;
}
