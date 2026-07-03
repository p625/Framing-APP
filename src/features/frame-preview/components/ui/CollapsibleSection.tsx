"use client";

import type { ReactNode } from "react";
import type { SidebarSectionId } from "../../ui/appUi.types";

interface CollapsibleSectionProps {
  id: SidebarSectionId;
  title: string;
  isOpen: boolean;
  onToggle: (id: SidebarSectionId) => void;
  children: ReactNode;
}

export function CollapsibleSection({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <section className="border-b border-zinc-100">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-zinc-50"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-zinc-900">{title}</span>
        <span
          className={`text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
