"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function HealerResolvePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const resolveHealer = async () => {
      if (!isSignedIn) {
        router.replace("/healer");
        return;
      }

      try {
        const res = await fetch("/api/healer", { method: "GET" });
        if (!res.ok) {
          router.replace("/healer");
          return;
        }

        const data = await res.json();
        const slug = data?.healer?.slug;
        router.replace(slug ? `/healer/${slug}/healing-space` : "/healer");
      } catch (err) {
        console.error("Failed to resolve healer route:", err);
        router.replace("/healer");
      }
    };

    resolveHealer();
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="relative z-10 w-full max-w-xl px-5 xl:px-0">
      <div className="my-10 mx-auto max-w-xl">
        <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
          <p className="text-sm text-gray-600">Redirecting to your healing space...</p>
        </div>
      </div>
    </div>
  );
}
