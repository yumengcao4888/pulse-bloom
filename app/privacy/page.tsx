"use client";

import { useEffect, useState } from "react";

export default function PrivacyPage() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => {
      setIsDark(root.classList.contains("dark"));
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const iframeSrc = `/privacy-termly.html?theme=${isDark ? "dark" : "light"}`;

  return (
    <div className="relative z-10 w-full max-w-2xl px-5 xl:px-0">
      <div className="mx-auto my-10 w-full">
        <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm dark:border-[rgb(var(--dark-border))] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="mt-6 overflow-hidden rounded-xl bg-white dark:bg-[rgb(var(--dark-card))]">
            <iframe
              title="Termly Privacy Policy"
              src={iframeSrc}
              className="h-[75vh] min-h-[700px] w-full bg-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
