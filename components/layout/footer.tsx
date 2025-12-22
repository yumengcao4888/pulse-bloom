import Link from "next/link";
import ThemeToggle from "@/components/layout/theme-toggle";

export default function Footer() {
  return (
    <footer className="w-full">
      <div className="mx-auto w-full max-w-5xl px-5 pb-10 text-center text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <p>Open source, built with care.</p>
          <ThemeToggle />
        </div>
        <p>
          <Link
            href="https://github.com/yumengcao4888/pulse-bloom"
            className="text-gray-600 underline-offset-4 hover:underline dark:text-gray-300"
          >
            GitHub
          </Link>{" "}
          © Copyleft 2025 PulseBloom
        </p>
      </div>
    </footer>
  );
}
