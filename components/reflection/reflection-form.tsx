"use client";

import { useState } from "react";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TriStateButton } from "@/components/reflection/tristate-button";

type Props = {
  slug: string;
};

type TriState = null | "yes" | "no";

export default function ReflectionForm({ slug }: Props) {
  const router = useRouter();

  const [grounded, setGrounded] = useState<TriState>(null);
  const [supported, setSupported] = useState<TriState>(null);
  const [connected, setConnected] = useState<TriState>(null);
  const [feeling, setFeeling] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!grounded || !supported || !connected) {
      setError("Please choose a response for each feeling.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          grounded,
          supported,
          connected,
          feeling,
        }),
      });

      if (!res.ok) {
        setError("Failed to save. Please try again.");
        setSubmitting(false);
        return;
      }

      setGrounded(null);
      setSupported(null);
      setConnected(null);
      setFeeling("");
      setSubmitting(false);

      router.push(`/reflection/${slug}?submitted=1`);
    } catch (err) {
      console.error(err);
      setError("Failed to save. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form action="/api/reflection" onSubmit={handleSubmit} method="POST" className="space-y-4">
      <input type="hidden" name="slug" value={slug} />

      <div className="space-y-2">
        <TriStateButton name="grounded" label="I feel grounded 🌱" value={grounded} onChange={setGrounded} />
        <TriStateButton name="supported" label="I feel supported 💛" value={supported} onChange={setSupported} />
        <TriStateButton name="connected" label="I feel connected 🤝" value={connected} onChange={setConnected} />

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}
      </div>

      <label className="block">
        <span className="text-gray-700">A few words, if you&apos;d like (optional)</span>
        <textarea
          name="feeling"
          className="w-full border p-3 rounded mt-1"
          placeholder="e.g. a word, a feeling, or a quiet thought…"
          onChange={(e) => setFeeling(e.target.value)}
          value={feeling}
          rows={3}
        />
      </label>

      <button
        type="submit"
        className="bg-blue-50/60 text-blue-800 hover:bg-violet-100/80 px-4 py-2 rounded transition-colors"
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}