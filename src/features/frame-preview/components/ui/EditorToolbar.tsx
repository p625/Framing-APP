"use client";

import type { ReactNode } from "react";

interface EditorToolbarProps {
  children: ReactNode;
}

export function EditorToolbar({ children }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2.5 shadow-sm">
      {children}
    </div>
  );
}

interface EditorToolbarButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "ghost";
}

export function EditorToolbarButton({
  label,
  onClick,
  disabled,
  variant = "default",
}: EditorToolbarButtonProps) {
  const classes =
    variant === "primary"
      ? "bg-zinc-900 text-white hover:bg-zinc-800"
      : variant === "ghost"
        ? "border-transparent text-zinc-600 hover:bg-zinc-100"
        : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${classes}`}
    >
      {label}
    </button>
  );
}
