"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import useScroll from "@/lib/hooks/use-scroll";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { LayoutDashboard } from "lucide-react";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { useLocale } from "@/components/shared/locale-provider";
import { yellowtail } from "@/app/fonts";
import icon from "@/app/icon.png";
import ThemeToggle from "@/components/layout/theme-toggle";

export default function NavBar() {
  const scrolled = useScroll(50);
  const { t } = useLocale();
  const { isSignedIn, isLoaded, userId } = useAuth();
  const [healerSlug, setHealerSlug] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    let isActive = true;

    const checkHealer = async () => {
      setHealerSlug(null);
      if (!isLoaded || !isSignedIn || !userId) {
        return;
      }
      try {
        const res = await fetch("/api/healer", { method: "GET" });
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (isActive) {
          setHealerSlug(data?.healer?.slug ?? null);
        }
      } catch (err) {
        console.error("Failed to check healer status:", err);
      }
    };

    checkHealer();

    return () => {
      isActive = false;
    };
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
      setIsDarkTheme(root.classList.contains("dark"));
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        className={`fixed top-0 flex w-full justify-center bg-white/30 backdrop-blur-xl ${
          scrolled ? "border-b border-gray-200 bg-white/50" : ""
        } z-30 transition-all`}
      >
        <div className="mx-5 flex h-16 w-full max-w-screen-xl items-center justify-between">
          <Link href="/" className="flex items-center font-display text-2xl">
            <Image
              src={icon}
              alt="Pulse Bloom"
              width="30"
              height="30"
              className="mr-2 rounded-sm"
            />
            <p className={yellowtail.className}>PulseBloom</p>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full border border-black bg-black px-4 py-1.5 text-sm text-white transition-colors hover:bg-white hover:text-black">
                  {t("nav.signIn")}
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonPopoverCard:
                      "w-fit max-w-sm border border-gray-200 bg-white/90 text-gray-900 shadow-lg backdrop-blur dark:border-[rgb(var(--dark-border))] dark:text-gray-100",
                    userButtonPopoverActionButton:
                      "dark:text-gray-100 dark:hover:bg-[rgb(var(--dark-card-hover))]",
                    userButtonPopoverCustomItemButton:
                      "dark:text-gray-100 dark:hover:bg-[rgb(var(--dark-card-hover))]",
                    userButtonPopoverCustomItemButtonIconBox:
                      "dark:text-gray-100",
                    userButtonPopoverCustomItemButtonIcon:
                      "dark:text-gray-100",
                  },
                  variables: isDarkTheme
                    ? {
                        colorBackground: "rgb(var(--dark-card))",
                        colorForeground: "#f9fafb",
                        colorMutedForeground: "#d1d5db",
                        colorMuted: "rgb(var(--dark-card-hover))",
                        colorNeutral: "#f9fafb",
                      }
                    : undefined,
                }}
              >
                <UserButton.MenuItems>
                  {healerSlug && (
                    <UserButton.Link
                      label={t("nav.healingSpace")}
                      labelIcon={<LayoutDashboard className="h-4 w-4" />}
                      href={`/healer/${healerSlug}/space`}
                    />
                  )}
                  {!healerSlug && (
                    <UserButton.Link
                      label={t("nav.createHealingSpace")}
                      labelIcon={<LayoutDashboard className="h-4 w-4" />}
                      href="/healer"
                    />
                  )}
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>
        </div>
      </div>
    </>
  );
}
