import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, id, className = "", style, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            style={leftIcon ? { paddingLeft: "2.75rem", ...style } : style}
            className={`w-full rounded-lg border bg-[#0d0d10] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all duration-150 focus:bg-[#121216] focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              leftIcon ? "pl-11" : ""
            } ${rightElement ? "pr-10" : ""} ${
              error
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-zinc-800 focus:border-accent focus:ring-accent/20"
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs font-medium text-rose-400">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-zinc-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

