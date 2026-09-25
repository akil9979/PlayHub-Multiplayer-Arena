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
        className={`flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex-shrink-0 text-rose-400">⚠️</span>
          <span className="truncate">{message}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-rose-500/20 px-2 py-1 text-[11px] font-bold text-rose-200 transition hover:bg-rose-500/30 active:scale-95"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="text-rose-400 hover:text-white transition"
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
      className={`rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-2xl text-rose-400 shadow-lg shadow-rose-500/10">
        ⚠️
      </div>
      <h3 className="mt-3 text-base font-bold text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-rose-300 leading-relaxed">
        {message}
      </p>

      {(onRetry || onDismiss) && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-500 active:scale-95"
            >
              <span>🔄</span>
              <span>Retry</span>
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
