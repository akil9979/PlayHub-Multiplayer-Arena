import type { FC, HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "danger" | "warning" | "info" | "neutral" | "accent" | "purple";
  size?: "sm" | "md";
}

export const Badge: FC<BadgeProps> = ({
  variant = "neutral",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 rounded-full font-medium tracking-wide",
    md: "text-xs px-2.5 py-1 rounded-full font-medium tracking-wide",
  }[size];

  const variantStyles = {
    success: "bg-emerald-950/70 text-emerald-400 border border-emerald-800/60",
    danger: "bg-rose-950/70 text-rose-400 border border-rose-800/60",
    warning: "bg-amber-950/70 text-amber-400 border border-amber-800/60",
    info: "bg-cyan-950/70 text-cyan-400 border border-cyan-800/60",
    accent: "bg-green-950/70 text-green-400 border border-green-800/60",
    purple: "bg-purple-950/70 text-purple-400 border border-purple-800/60",
    neutral: "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 select-none ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
