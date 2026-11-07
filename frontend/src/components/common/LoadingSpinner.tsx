import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  center?: boolean;
}

export default function LoadingSpinner({
  size = "md",
  label,
  className = "",
  center = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-7 h-7",
    lg: "w-10 h-10",
  }[size];

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <Loader2
        className={`${sizeClasses} animate-spin text-accent drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]`}
        role="status"
        aria-label={label || "Loading"}
      />
      {label && <p className="text-xs font-medium text-zinc-400">{label}</p>}
    </div>
  );

  if (center) {
    return (
      <div className="flex w-full items-center justify-center p-8">
        {spinner}
      </div>
    );
  }

  return spinner;
}
