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
    sm: "h-4 w-4 border-2",
    md: "h-7 w-7 border-2",
    lg: "h-10 w-10 border-3",
  }[size];

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses} animate-spin rounded-full border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/20`}
        role="status"
        aria-label={label || "Loading"}
      />
      {label && <p className="text-xs font-medium text-slate-400">{label}</p>}
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
