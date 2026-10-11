interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
}

export default function ErrorMessage({
  title = "Something went wrong",
  message,
  onRetry,
  onDismiss,
  compact = false,
  className = "",
}: ErrorMessageProps) {
  if (compact) {
    return (
      <div
        role="alert"
        className={`flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300 ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex-shrink-0 text-red-400">⚠️</span>
          <span className="truncate">{message}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-red-500/20 px-2 py-1 text-[11px] font-semibold text-red-200 transition-colors hover:bg-red-500/30"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="text-red-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-2xl text-red-400">
        ⚠️
      </div>
      <h3 className="mt-3 text-base font-bold text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-red-300 leading-relaxed">
        {message}
      </p>

      {(onRetry || onDismiss) && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500"
            >
              <span>🔄</span>
              <span>Retry</span>
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg border border-[#3f3f46] bg-[#27272a] px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-[#3f3f46] hover:text-white"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
