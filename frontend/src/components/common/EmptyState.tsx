import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  /** Optional title to display when there is no data */
  title?: string;
  /** Optional description or guidance for the user */
  description?: string;
  /** Optional React node to render custom illustration or icon */
  illustration?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  action?: {
    label: string;
    to: string;
  };
  /** Optional action button click handler */
  onAction?: () => void;
  /** Optional label for the action button */
  actionLabel?: string;
  /** Additional Tailwind class names for customization */
  className?: string;
}

/**
 * A reusable component that presents a friendly empty‑state UI.
 * It is used across the app wherever data collections may be empty.
 */
export default function EmptyState({
  title = "Nothing to display",
  description,
  illustration,
  onAction,
  actionLabel = "Refresh",
  icon,
  compact = false,
  action,
  className = "",
}: EmptyStateProps) {
  const visual = icon ?? illustration;

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-3 text-center ${
        compact ? "py-7" : "py-12"
      } ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 shadow-inner">
        {visual ? visual : <Inbox className="w-7 h-7 text-zinc-500" />}
      </div>
      <h2 className="text-base font-semibold text-zinc-100 font-display">
        {title}
      </h2>
      {description && (
        <p className="max-w-md text-xs sm:text-sm text-zinc-400 leading-relaxed">
          {description}
        </p>
      )}
      {action ? (
        <Link
          to={action.to}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-accent-hover shadow-[0_0_16px_-2px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_-2px_rgba(34,197,94,0.45)]"
        >
          {action.label}
        </Link>
      ) : onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-accent-hover shadow-[0_0_16px_-2px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_-2px_rgba(34,197,94,0.45)] cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
