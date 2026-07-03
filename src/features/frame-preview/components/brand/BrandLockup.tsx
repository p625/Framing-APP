import { APP_NAME, APP_TAGLINE } from "../../brand/brand";
import { LogoMark } from "./LogoMark";

interface BrandLockupProps {
  showTagline?: boolean;
  subtitle?: string;
  compact?: boolean;
}

export function BrandLockup({
  showTagline = true,
  subtitle,
  compact = false,
}: BrandLockupProps) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={compact ? 28 : 36} className="shrink-0 shadow-sm" />
      <div className="min-w-0">
        <p className="fs-heading text-base leading-tight">{APP_NAME}</p>
        {showTagline ? (
          <p className="text-[11px] font-medium tracking-wide text-fs-gold">
            {APP_TAGLINE}
          </p>
        ) : null}
        {subtitle ? (
          <p className="mt-0.5 text-xs text-fs-muted">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
