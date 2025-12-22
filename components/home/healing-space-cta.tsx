"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function HealingSpaceCta() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/healer", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        const slug = data?.healer?.slug;
        router.push(slug ? `/healer/${slug}/healing-space` : "/healer");
        return;
      }
    } catch (err) {
      console.error("Failed to resolve healer route:", err);
    } finally {
      setIsLoading(false);
    }

    router.push("/healer");
  };

  return (
    <>
      <SignedOut>
        <SignUpButton mode="modal">
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
          {isLoading ? "Loading..." : "Create a healing space"}
        </button>
      </SignedIn>
    </>
  );
}
