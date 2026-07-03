"use client";

import type { ReactNode } from "react";

interface EditorToolbarProps {
  children: ReactNode;
}

export function EditorToolbar({ children }: EditorToolbarProps) {
  return <div className="fs-toolbar">{children}</div>;
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
  const variantClass =
    variant === "primary"
      ? "fs-btn-primary"
      : variant === "ghost"
        ? "fs-btn-ghost"
        : "fs-btn-secondary";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`fs-btn ${variantClass}`}
    >
      {label}
    </button>
  );
}
