"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignUpButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";

type Props = {
  initialSlug?: string | null;
  initialChecked?: boolean;
};

export default function SpaceCta({
  initialSlug = null,
  initialChecked = false,
}: Props) {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [hasChecked, setHasChecked] = useState(initialChecked);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const lastUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;
    if (lastUserId.current === userId) return;
    lastUserId.current = userId;
    if (!userId) {
      setSlug(null);
      setHasChecked(true);
      return;
    }
    setSlug(null);
    setHasChecked(false);
  }, [isLoaded, userId]);

  useEffect(() => {
    let isActive = true;

    const checkHealer = async () => {
      if (hasChecked) {
        return;
      }
      if (!isLoaded || !isSignedIn) {
        if (isActive) {
          setHasChecked(true);
        }
        return;
      }
      try {
        const res = await fetch("/api/healer", { method: "GET" });
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (isActive) {
          setSlug(data?.healer?.slug ?? null);
        }
      } catch (err) {
        console.error("Failed to check healer status:", err);
      } finally {
        if (isActive) {
          setHasChecked(true);
        }
      }
    };

    checkHealer();

    return () => {
      isActive = false;
    };
  }, [hasChecked, isLoaded, isSignedIn]);

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

  const signUpAppearance = isDarkTheme
    ? {
        elements: {
          socialButtonsBlockButton:
            "border border-[rgb(var(--dark-border))] bg-[rgb(var(--dark-card))] hover:bg-[rgb(var(--dark-card-hover))]",
          socialButtonsBlockButtonText: "text-gray-100",
          footerActionText: "text-gray-300",
          footerActionLink: "text-gray-100 hover:text-white",
        },
        variables: {
          colorBackground: "rgb(var(--dark-card))",
          colorBorder: "rgb(var(--dark-border))",
          colorText: "#f9fafb",
          colorTextSecondary: "#d1d5db",
          colorInputBackground: "rgb(var(--dark-card))",
          colorInputBorder: "rgb(var(--dark-border))",
          colorInputText: "#f9fafb",
          colorPrimaryBackground: "rgb(var(--dark-cta-hover))",
          colorPrimaryText: "#ffffff",
          colorPrimaryBorder: "rgb(var(--dark-cta))",
          colorDanger: "#f87171",
          colorNeutralBackground: "rgb(var(--dark-card-hover))",
          colorNeutralText: "#f9fafb",
          colorNeutralBorder: "rgb(var(--dark-border))",
        },
      }
    : undefined;

  const handleClick = async () => {
    setLoading(true);
    try {
      if (!isLoaded || !isSignedIn) {
        return;
      }
      if (slug) {
        router.push(`/healer/${slug}/space`);
        return;
      }
      const res = await fetch("/api/healer", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        const nextSlug = data?.healer?.slug;
        if (nextSlug) {
          setSlug(nextSlug);
        }
        router.push(nextSlug ? `/healer/${nextSlug}/space` : "/healer");
        return;
      }
    } catch (err) {
      console.error("Failed to resolve healer route:", err);
    } finally {
      setLoading(false);
    }

  };

  const showReturn = Boolean(slug) && hasChecked;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-white/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        {isLoaded ? (
          <>
            <SignedOut>
              <h2 className="text-base font-semibold text-gray-900">
                Begin with a gentle pulse
              </h2>
              <p className="text-sm text-gray-600">
                Create a space and invite your first reflection.
              </p>
            </SignedOut>
            <SignedIn>
              <h2 className="text-base font-semibold text-gray-900">
                {showReturn ? "Return to your healing space" : "Begin with a gentle pulse"}
              </h2>
              <p className="text-sm text-gray-600">
                {showReturn
                  ? "Gently hold space for your next reflection."
                  : "Create a space and invite your first reflection."}
              </p>
            </SignedIn>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold text-gray-900">Begin with a gentle pulse</h2>
            <p className="text-sm text-gray-600">Create a space and invite your first reflection.</p>
          </>
        )}
      </div>
      <div>
        {isLoaded ? (
          <>
            <SignedOut>
              <SignUpButton
                mode="modal"
                forceRedirectUrl="/healer/resolve"
                signInForceRedirectUrl="/healer/resolve"
                appearance={signUpAppearance}
              >
                <button className="w-full rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white md:w-auto">
                  Create a healing space
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <button
                type="button"
                className="w-full rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 md:w-auto"
                onClick={handleClick}
                disabled={loading}
                aria-busy={loading}
              >
                {loading
                  ? "Loading..."
                  : showReturn
                  ? "Enter your healing space"
                  : "Create a healing space"}
              </button>
            </SignedIn>
          </>
        ) : (
          <button
            type="button"
            className="w-full rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white opacity-70 md:w-auto"
            disabled
          >
            Loading...
          </button>
        )}
      </div>
    </section>
  );
}
