interface LogoMarkProps {
  size?: number;
  className?: string;
  title?: string;
}

export function LogoMark({
  size = 32,
  className = "",
  title = "FrameStudio",
}: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <rect width="32" height="32" rx="8" className="fill-fs-primary" />
      <path
        d="M7 7H20V10H10V22H7V7Z"
        className="fill-fs-surface"
        opacity="0.95"
      />
      <path
        d="M10 10H17V12H12V17H10V10Z"
        className="fill-fs-gold"
      />
      <path
        d="M22 22V9H25V22H22Z"
        className="fill-fs-gold"
        opacity="0.85"
      />
      <path
        d="M22 22H9V25H22V22Z"
        className="fill-fs-gold"
        opacity="0.85"
      />
    </svg>
  );
}
