import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full">
      <div className="mx-auto w-full max-w-5xl px-5 pb-10 text-center text-xs text-gray-500">
        <p>Open source, built with care.</p>
        <p>
          <Link
            href="https://github.com/yumengcao4888/pulse-bloom"
            className="text-gray-600 underline-offset-4 hover:underline"
          >
            GitHub
          </Link>{" "}
          © Copyleft 2025 PulseBloom
        </p>
      </div>
    </footer>
  );
}
