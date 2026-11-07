import { AlertCircle, RotateCcw, X } from "lucide-react";

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
        className={`flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-200 backdrop-blur-sm ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span className="truncate">{message}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2 py-1 text-[11px] font-semibold text-red-200 transition-colors hover:bg-red-500/30 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="p-0.5 text-red-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center backdrop-blur-sm shadow-[0_8px_30px_-6px_rgba(239,68,68,0.15)] ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-red-400 ring-1 ring-red-500/40">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="mt-3.5 text-base font-bold text-white font-display">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-red-300/90 leading-relaxed">
        {message}
      </p>

      {(onRetry || onDismiss) && (
        <div className="mt-5 flex items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white transition-all shadow-[0_0_16px_-2px_rgba(239,68,68,0.4)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
