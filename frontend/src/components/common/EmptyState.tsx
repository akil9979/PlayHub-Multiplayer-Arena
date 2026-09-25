import React from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  /** Optional title to display when there is no data */
  title?: string;
  /** Optional description or guidance for the user */
  description?: string;
  /** Optional React node to render custom illustration or icon */
  illustration?: React.ReactNode;
  icon?: React.ReactNode;
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
  title = 'Nothing to display',
  description,
  illustration,
  onAction,
  actionLabel = 'Refresh',
  icon,
  compact = false,
  action,
  className = '',
}: EmptyStateProps) {
  const visual = icon ?? illustration;

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-3 text-center ${compact ? 'py-7' : 'py-12'} ${className}`}
    >
      {visual && <div className="text-4xl opacity-70">{visual}</div>}
      <h2 className="text-lg font-semibold text-white">
        {title}
      </h2>
      {description && (
        <p className="max-w-md text-sm text-slate-400">
          {description}
        </p>
      )}
      {action ? (
        <Link
          to={action.to}
          className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
        >
          {action.label}
        </Link>
      ) : onAction ? (
        <button
          onClick={onAction}
          className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
