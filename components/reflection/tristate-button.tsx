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
    const next: TriState = state === "yes" ? "no" : "yes";

    setState(next);
    onChange(next);
  }

  const base =
    "w-full px-4 py-3 rounded-lg cursor-pointer transition inline-flex items-center justify-center gap-1";

  const color =
    state === "yes"
      ? "bg-green-100 border-green-400 hover:bg-green-100/60 hover:backdrop-blur-sm hover:shadow-md"
      : state === "no"
      ? "bg-red-100 border-red-400 hover:bg-red-100/60 hover:backdrop-blur-sm hover:shadow-md"
      : "bg-gray-100 border-gray-300 opacity-80 hover:bg-gray-100/60 hover:backdrop-blur-sm hover:shadow-md";

  return (
    <button type="button" className={`${base} ${color} inline-flex items-center justify-center`} onClick={nextState}>
      {label}
      {state === "yes" && <CheckIcon className="w-5 h-5 text-green-500" /> }
      {state === "no" && <XMarkIcon className="w-5 h-5 text-red-500" />}
    </button>
  );
}