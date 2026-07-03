import type { ReactNode } from "react";

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section className="space-y-3 border-t border-zinc-100 pt-5">
      <h2 className="text-sm font-medium text-zinc-900">{title}</h2>
      {children}
    </section>
  );
}

export const LOCAL_STORAGE_HINT =
  "Saved locally in this browser. Data stays on this device and is not synced.";
