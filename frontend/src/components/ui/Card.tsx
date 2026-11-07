import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "interactive";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    const baseStyles = "rounded-xl border transition-all duration-150";

    const variantStyles = {
      default: "bg-[#111115] border-zinc-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]",
      raised: "bg-[#141419] border-zinc-700/70 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.6)]",
      interactive:
        "bg-[#111115] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#141419] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] cursor-pointer hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.7)]",
    }[variant];

    return (
      <div ref={ref} className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

