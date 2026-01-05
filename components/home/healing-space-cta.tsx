"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignUpButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";

type Props = {
  initialHealerSlug?: string | null;
  initialChecked?: boolean;
};

export default function HealingSpaceCta({
  initialHealerSlug = null,
  initialChecked = false,
}: Props) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [healerSlug, setHealerSlug] = useState<string | null>(initialHealerSlug);
  const [checkedHealer, setCheckedHealer] = useState(initialChecked);

  useEffect(() => {
    let isActive = true;

    const checkHealer = async () => {
      if (checkedHealer) {
        return;
      }
      if (!isLoaded || !isSignedIn) {
        if (isActive) {
          setCheckedHealer(true);
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
          setHealerSlug(data?.healer?.slug ?? null);
        }
      } catch (err) {
        console.error("Failed to check healer status:", err);
      } finally {
        if (isActive) {
          setCheckedHealer(true);
        }
      }
    };

    checkHealer();

    return () => {
      isActive = false;
    };
  }, [checkedHealer, isLoaded, isSignedIn]);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (!isLoaded || !isSignedIn) {
        return;
      }
      if (healerSlug) {
        router.push(`/healer/${healerSlug}/space`);
        return;
      }
      const res = await fetch("/api/healer", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        const slug = data?.healer?.slug;
        if (slug) {
          setHealerSlug(slug);
        }
        router.push(slug ? `/healer/${slug}/space` : "/healer");
        return;
      }
    } catch (err) {
      console.error("Failed to resolve healer route:", err);
    } finally {
      setIsLoading(false);
    }

  };

  const showReturnCopy = Boolean(healerSlug) && checkedHealer;

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
                {showReturnCopy ? "Return to your healing space" : "Begin with a gentle pulse"}
              </h2>
              <p className="text-sm text-gray-600">
                {showReturnCopy
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
              >
                <button className="w-full rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white md:w-auto">
                  Create a healing space
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <button
                type="button"
                className="w-full rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white md:w-auto"
                onClick={handleClick}
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading
                  ? "Loading..."
                  : showReturnCopy
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
