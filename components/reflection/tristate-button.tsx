"use client";
import { useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

type TriState = null | "yes" | "no";

type TriStateButtonProps = {
  name: string;
  label: string;
  onChange: (value: TriState) => void;
};

export function TriStateButton({ name, label, onChange }: TriStateButtonProps) {
  const [state, setState] = useState<TriState>(null);

  function nextState() {
    let next: TriState = null;
    if (state === null) next = "yes";
    else if (state === "yes") next = "no";
    else next = null;

    setState(next);
    onChange(next);
  }

  const base =
    "w-full px-4 py-3 rounded-lg border cursor-pointer transition";

  const color =
    state === "yes"
      ? "bg-green-100 border-green-400"
      : state === "no"
      ? "bg-red-100 border-red-400"
      : "bg-gray-100 border-gray-300 opacity-80";

  return (
    <button type="button" className={`${base} ${color} inline-flex items-center justify-center`} onClick={nextState}>
      {label}
      {state === "yes" && <CheckIcon className="w-5 h-5 text-green-500" /> }
      {state === "no" && <XMarkIcon className="w-5 h-5 text-red-500" />}
    </button>
  );
}