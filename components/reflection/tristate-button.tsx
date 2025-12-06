"use client";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

type TriState = null | "yes" | "no";

type TriStateButtonProps = {
  name: string;
  label: string;
  value: TriState;
  onChange: (value: TriState) => void;
};

export function TriStateButton({ name, label, value, onChange }: TriStateButtonProps) {
  const handleClick = () => {
    const next: TriState =
      value === null ? "yes" : value === "yes" ? "no" : null;
    onChange(next);
  };

  const base =
    "w-full px-4 py-3 rounded-lg cursor-pointer transition inline-flex items-center justify-center gap-1";

  const color =
    value === "yes"
      ? "bg-green-100 border-green-400 hover:bg-green-100/60 hover:backdrop-blur-sm hover:shadow-md"
      : value === "no"
      ? "bg-red-100 border-red-400 hover:bg-red-100/60 hover:backdrop-blur-sm hover:shadow-md"
      : "bg-gray-100 border-gray-300 opacity-80 hover:bg-gray-100/60 hover:backdrop-blur-sm hover:shadow-md";

  const statusLabel =
    value === "yes" ? (<CheckIcon className="w-5 h-5 text-green-500" />) : value === "no" ? (<XMarkIcon className="w-5 h-5 text-red-500" />) : "";
  
  return (
    <button
      type="button"
      name={name}
      onClick={handleClick}
      className={`${base} ${color}`}
    >
      <span>{label}</span>
      <span className="text-sm text-gray-600">{statusLabel}</span>
    </button>
  );
}