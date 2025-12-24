"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function HealerRedirect() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    let isActive = true;

    const redirectIfHealer = async () => {
      if (!isLoaded || !isSignedIn) {
        return;
      }
      try {
        const res = await fetch("/api/healer", { method: "GET" });
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        const slug = data?.healer?.slug;
        if (isActive && slug) {
          router.replace(`/healer/${slug}/healing-space`);
        }
      } catch (err) {
        console.error("Failed to resolve healer redirect:", err);
      }
    };

    redirectIfHealer();

    return () => {
      isActive = false;
    };
  }, [isLoaded, isSignedIn, router]);

  return null;
}
