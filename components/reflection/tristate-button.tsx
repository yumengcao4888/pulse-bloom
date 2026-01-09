"use client";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

type TriState = null | "yes" | "no";

type TriStateButtonProps = {
  name: string;
  label: string;
  value: TriState;
  onChange: (value: TriState) => void;
  disabled?: boolean;
};

export function TriStateButton({
  name,
  label,
  value,
  onChange,
  disabled = false,
}: TriStateButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    const next: TriState =
      value === null ? "yes" : value === "yes" ? "no" : "yes";
    onChange(next);
  };

  const base =
    "w-full px-4 py-3 rounded-lg border border-pulse-bloom/30 text-gray-900 transition inline-flex items-center justify-center gap-1 disabled:cursor-not-allowed disabled:opacity-70 dark:text-gray-100";

  const color =
    value === "yes"
      ? "bg-green-100 hover:bg-green-100/60 hover:backdrop-blur-sm hover:shadow-md dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30"
      : value === "no"
      ? "bg-red-100 hover:bg-red-100/60 hover:backdrop-blur-sm hover:shadow-md dark:bg-rose-500/20 dark:hover:bg-rose-500/30"
      : "bg-gray-100 opacity-80 hover:bg-gray-100/60 hover:backdrop-blur-sm hover:shadow-md dark:bg-[rgb(var(--dark-card))] dark:hover:bg-[rgb(var(--dark-card-hover))]";

  const statusLabel =
    value === "yes" ? (<CheckIcon className="w-5 h-5 text-green-500" />) : value === "no" ? (<XMarkIcon className="w-5 h-5 text-red-500" />) : "";
  
  return (
    <button
      type="button"
      name={name}
      onClick={handleClick}
      disabled={disabled}
      className={`${base} ${color}`}
    >
      <span>{label}</span>
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {statusLabel}
      </span>
    </button>
  );
}
