import type { ReactNode } from "react";

interface WorkflowSectionProps {
  step: number;
  title: string;
  children: ReactNode;
}

export function WorkflowSection({ step, title, children }: WorkflowSectionProps) {
  return (
    <section className="space-y-3 border-t border-zinc-100 pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
          {step}
        </span>
        <h2 className="text-sm font-medium text-zinc-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}
