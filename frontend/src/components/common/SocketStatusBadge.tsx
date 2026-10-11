import { useSocketStatus } from "../../utils/useSocketStatus";

interface SocketStatusBadgeProps {
  showLabel?: boolean;
  showRetry?: boolean;
  className?: string;
}

export default function SocketStatusBadge({
  showLabel = true,
  showRetry = false,
  className = "",
}: SocketStatusBadgeProps) {
  const { status, reconnect, error } = useSocketStatus();

  const config = {
    connected: {
      color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      dot: "bg-emerald-500",
      ping: true,
      label: "Connected",
      title: "Connected to game server",
    },
    connecting: {
      color: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      dot: "bg-amber-400",
      ping: true,
      label: "Connecting...",
      title: "Establishing real-time connection...",
    },
    disconnected: {
      color: "border-[#27272a] bg-[#18181b] text-zinc-400",
      dot: "bg-zinc-500",
      ping: false,
      label: "Disconnected",
      title: "Disconnected from game server",
    },
    error: {
      color: "border-red-500/30 bg-red-500/10 text-red-400",
      dot: "bg-red-500",
      ping: false,
      label: "Connection Error",
      title: error || "Connection to game server failed",
    },
  }[status];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        title={config.title}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.color} transition-colors`}
      >
        <span className="relative flex h-2 w-2">
          {config.ping && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dot}`}
            />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dot}`} />
        </span>
        {showLabel && <span>{config.label}</span>}
      </span>

      {showRetry && (status === "disconnected" || status === "error") && (
        <button
          type="button"
          onClick={reconnect}
          title="Reconnect to server"
          className="rounded-lg border border-[#3f3f46] bg-[#27272a] px-2 py-0.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:bg-[#3f3f46] hover:text-white"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
