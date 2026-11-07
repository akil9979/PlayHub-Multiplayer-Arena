import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 rounded-md gap-1.5",
      md: "text-sm px-4 py-2 rounded-lg gap-2",
      lg: "text-base px-5 py-2.5 rounded-xl gap-2.5 font-semibold",
    }[size];

    const variantStyles = {
      primary:
        "bg-accent hover:bg-accent-hover text-zinc-950 font-semibold shadow-sm hover:shadow-[0_0_20px_-2px_rgba(34,197,94,0.4)] disabled:hover:shadow-none active:bg-green-700",
      secondary:
        "bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-100 border border-zinc-700/80 hover:border-zinc-600",
      ghost:
        "bg-transparent hover:bg-zinc-800/60 text-zinc-300 hover:text-white border border-transparent",
      danger:
        "bg-red-600/90 hover:bg-red-500 text-white shadow-sm hover:shadow-[0_0_20px_-2px_rgba(239,68,68,0.4)]",
      outline:
        "bg-transparent hover:bg-zinc-800/50 text-zinc-200 border border-zinc-700 hover:border-zinc-500",
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

