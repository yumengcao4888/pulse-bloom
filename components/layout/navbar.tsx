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

export default function NavBar() {
  const scrolled = useScroll(50);
  const { t } = useLocale();
  const { isSignedIn, userId } = useAuth();
  const [healerSlug, setHealerSlug] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const checkHealer = async () => {
      setHealerSlug(null);
      if (!isSignedIn || !userId) {
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
  }, [isSignedIn, userId]);

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
            <LanguageSwitcher />
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full border border-black bg-black px-4 py-1.5 text-sm text-white transition-colors hover:bg-white hover:text-black">
                  {t("nav.signIn")}
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton>
                <UserButton.MenuItems>
                  {healerSlug && (
                    <UserButton.Link
                      label={t("nav.healingSpace")}
                      labelIcon={<LayoutDashboard className="h-4 w-4" />}
                      href={`/healer/${healerSlug}/healing-space`}
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
