import "./globals.css";
import cx from "classnames";
import { sfPro, inter } from "./fonts";
import Footer from "@/components/layout/footer";
import { Suspense } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import Navbar from "@/components/layout/navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { getLocale } from "@/lib/i18n-server";
import { LocaleProvider } from "@/components/shared/locale-provider";

export const metadata = {
  title: "PulseBloom - Gently showing the impact of care",
  description:
    "PulseBloom is a gentle reflection tool for healers and space-holders, helping care become visible through shared emotional presence.",
  metadataBase: new URL("https://pulse-bloom.vercel.app/"),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <ClerkProvider>
      <html lang={locale}>
        <body className={cx(sfPro.variable, inter.variable, "bg-white text-gray-900 dark:bg-black dark:text-gray-100")}>
          <div className="fixed h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-pulse-bloom-soft dark:from-black dark:via-black dark:to-black" />
          <LocaleProvider locale={locale}>
            <div className="relative z-10 flex min-h-screen flex-col">
              <Suspense fallback="...">
                <Navbar />
              </Suspense>
              <main className="flex w-full flex-col items-center justify-start pb-6 pt-20 md:flex-1 md:justify-center md:pt-20 md:pb-10">
                {children}
              </main>
              <Footer />
            </div>
            <VercelAnalytics />
          </LocaleProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
