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
        <body className={cx(sfPro.variable, inter.variable)}>
          <div className="fixed h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-100" />
          <LocaleProvider locale={locale}>
            <Suspense fallback="...">
              <Navbar />
            </Suspense>
            <main className="flex min-h-screen w-full flex-col items-center justify-center py-32">
              {children}
            </main>
            <Footer />
            <VercelAnalytics />
          </LocaleProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
